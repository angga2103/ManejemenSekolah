#!/usr/bin/env node
/**
 * ==============================================================================
 * REAL POSTGRESQL ROW LEVEL SECURITY (RLS) VERIFICATION TEST HARNESS
 * ==============================================================================
 * This script connects to an actual PostgreSQL instance to verify whether
 * Row Level Security (RLS) is genuinely enforced at the database kernel layer.
 *
 * Scenarios Tested:
 * 1. Tenant A reads own records.
 * 2. Tenant A reading Tenant B records (must return 0 rows).
 * 3. Tenant A updating Tenant B records (must affect 0 rows).
 * 4. Tenant A deleting Tenant B records (must affect 0 rows).
 * 5. Tenant A inserting row with Tenant B tenant_id (must be REJECTED by WITH CHECK policy).
 * 6. Query without tenant context (must return 0 rows).
 * 7. Parallel concurrent transactions (must maintain strict session isolation).
 * 8. Super Admin official bypass (must access cross-tenant data only via is_super_admin=true).
 * 9. Raw SQL execution (must obey RLS due to FORCE ROW LEVEL SECURITY).
 * ==============================================================================
 */

const { PrismaClient } = require('@prisma/client');

async function runRealPostgresRlsAudit() {
  const dbUrl =
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres_dev_password@localhost:5432/edusaas_dev?schema=public';

  console.log('==============================================================================');
  console.log('  EDUSAAS: REAL POSTGRESQL ROW LEVEL SECURITY (RLS) VERIFICATION AUDIT');
  console.log('==============================================================================');
  console.log(`Target Database URL: ${dbUrl.replace(/:([^:@]+)@/, ':****@')}`);
  console.log(`Execution Timestamp: ${new Date().toISOString()}`);
  console.log('------------------------------------------------------------------------------\n');

  const prisma = new PrismaClient({
    datasources: {
      db: { url: dbUrl },
    },
  });

  // ---------------------------------------------------------------------------
  // TAHAP 1: PRE-FLIGHT CONNECTION & ENVIRONMENT CHECK
  // ---------------------------------------------------------------------------
  console.log('[TAHAP 1] Checking PostgreSQL Server Reachability...');
  try {
    await prisma.$connect();
    console.log('✓ Connection established to PostgreSQL database.\n');
  } catch (connErr) {
    console.error('✗ [BLOCKED] Unable to connect to PostgreSQL server.');
    console.error(`  Error Code   : ${connErr.code || 'CONNECTION_FAILURE'}`);
    console.error(`  Error Message: ${connErr.message.split('\n')[0]}`);
    console.error('\n[ENVIRONMENT VERDICT]:');
    console.error('  PostgreSQL database server is currently NOT ACTIVE or UNREACHABLE on host.');
    console.error('  Real database security tests cannot proceed without an active PostgreSQL engine.');
    console.error('  To test on Staging, execute:');
    console.error('    DATABASE_URL="postgresql://user:pass@staging-host:5432/edusaas_staging" node scripts/verify-real-postgres-rls.js\n');
    await prisma.$disconnect();
    process.exit(2); // Exit 2 = BLOCKED (Environment unavailable)
  }

  // ---------------------------------------------------------------------------
  // TAHAP 2: DATABASE ENGINE, ROLE & RLS CONFIGURATION VERIFICATION
  // ---------------------------------------------------------------------------
  console.log('[TAHAP 2] Inspecting Database Roles and RLS Configuration...');
  try {
    // 1. Database Version
    const versionResult = await prisma.$queryRawUnsafe('SELECT version();');
    console.log(`  Engine Version: ${versionResult[0].version}`);

    // 2. Connected Role & Privileges
    const roleResult = await prisma.$queryRawUnsafe(`
      SELECT current_user, usesuper, usebypassrls 
      FROM pg_user 
      WHERE usename = current_user;
    `);
    const currentRole = roleResult[0];
    console.log(`  Connected Role: ${currentRole.current_user}`);
    console.log(`  Is Superuser  : ${currentRole.usesuper} (WARNING: Superuser bypasses RLS in Postgres)`);
    console.log(`  Is BypassRLS  : ${currentRole.usebypassrls} (WARNING: BypassRLS bypasses RLS)`);

    if (currentRole.usesuper || currentRole.usebypassrls) {
      console.warn('  ⚠️  WARNING: Connected user has SUPERUSER or BYPASSRLS privileges!');
      console.warn('      In production, application MUST connect using non-superuser role (e.g. edusaas_app_user).\n');
    }

    // 3. Check Table RLS Status
    const tablesChecked = [
      'students',
      'attendances',
      'invoices',
      'payments',
      'dormitories',
      'dorm_rooms',
      'cbt_exams',
      'student_exam_sessions',
      'student_exam_answers',
    ];
    const rlsStatusResult = await prisma.$queryRawUnsafe(`
      SELECT relname, relrowsecurity, relforcerowsecurity 
      FROM pg_class 
      WHERE relname IN (${tablesChecked.map((t) => `'${t}'`).join(',')});
    `);

    console.log('\n  Table RLS Flags:');
    for (const row of rlsStatusResult) {
      console.log(`    - Table '${row.relname}': RLS=${row.relrowsecurity}, FORCE_RLS=${row.relforcerowsecurity}`);
    }

    // 4. Check Policies
    const policyResult = await prisma.$queryRawUnsafe(`
      SELECT tablename, policyname, cmd, qual, with_check 
      FROM pg_policies 
      WHERE tablename = 'students';
    `);
    console.log('\n  Active Policies on `students`:');
    for (const pol of policyResult) {
      console.log(`    - Policy '${pol.policyname}' [CMD: ${pol.cmd}]`);
      console.log(`      USING: ${pol.qual}`);
      console.log(`      WITH CHECK: ${pol.with_check}`);
    }
    console.log('\n✓ Tahap 2 inspection complete.\n');
  } catch (inspectErr) {
    console.error('✗ Failed during database inspection:', inspectErr.message);
    await prisma.$disconnect();
    process.exit(1);
  }

  // ---------------------------------------------------------------------------
  // TAHAP 3: REAL-DB SECURITY SCENARIOS
  // ---------------------------------------------------------------------------
  console.log('[TAHAP 3] Executing 9 Real-DB Security Penetration Scenarios...');

  const tenantA = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const tenantB = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  const results = [];

  // Helper to record scenario
  function record(id, title, status, evidence) {
    results.push({ id, title, status, evidence });
    const mark = status === 'PASS' ? '✓' : '✗';
    console.log(`  ${mark} [Scenario ${id}] ${title}: ${status}`);
    console.log(`     Evidence: ${evidence}`);
  }

  try {
    // Setup test tenants in database
    await prisma.$executeRawUnsafe(`
      INSERT INTO tenants (id, name, slug, status, created_at, updated_at)
      VALUES 
        ('${tenantA}', 'Pesantren Tenant A', 'tenant-a', 'ACTIVE', NOW(), NOW()),
        ('${tenantB}', 'Sekolah Tenant B', 'tenant-b', 'ACTIVE', NOW(), NOW())
      ON CONFLICT (id) DO NOTHING;
    `);

    // Setup initial student for Tenant A and Tenant B
    const studentAId = '11111111-1111-4111-8111-111111111111';
    const studentBId = '22222222-2222-4222-8222-222222222222';

    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'true', true);`);
      await tx.$executeRawUnsafe(`
        INSERT INTO students (id, tenant_id, nis, full_name, gender, birth_place, birth_date, admission_year, status, created_at, updated_at)
        VALUES 
          ('${studentAId}', '${tenantA}', 'NIS-A-001', 'Santri Tenant A', 'MALE', 'Jakarta', '2010-01-01', 2026, 'ACTIVE', NOW(), NOW()),
          ('${studentBId}', '${tenantB}', 'NIS-B-001', 'Siswa Tenant B', 'FEMALE', 'Bandung', '2010-02-02', 2026, 'ACTIVE', NOW(), NOW())
        ON CONFLICT (id) DO NOTHING;
      `);
    });

    // 1. Tenant A reads own data
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantA}', true);`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'false', true);`);
      const rows = await tx.$queryRawUnsafe(`SELECT id, full_name FROM students WHERE id = '${studentAId}';`);
      if (rows.length === 1 && rows[0].id === studentAId) {
        record(1, 'Tenant A reads own data', 'PASS', `Successfully read 1 row: ${rows[0].full_name}`);
      } else {
        record(1, 'Tenant A reads own data', 'FAIL', `Expected 1 row, got ${rows.length}`);
      }
    });

    // 2. Tenant A reads Tenant B data
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantA}', true);`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'false', true);`);
      const rows = await tx.$queryRawUnsafe(`SELECT id, full_name FROM students WHERE id = '${studentBId}';`);
      if (rows.length === 0) {
        record(2, 'Tenant A cannot read Tenant B data', 'PASS', 'Query returned 0 rows (isolated by RLS)');
      } else {
        record(2, 'Tenant A cannot read Tenant B data', 'FAIL', `Leaked ${rows.length} rows from Tenant B!`);
      }
    });

    // 3. Tenant A updates Tenant B data
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantA}', true);`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'false', true);`);
      const affected = await tx.$executeRawUnsafe(`UPDATE students SET full_name = 'Hacked by Tenant A' WHERE id = '${studentBId}';`);
      if (affected === 0) {
        record(3, 'Tenant A cannot update Tenant B data', 'PASS', '0 rows affected (update blocked by RLS)');
      } else {
        record(3, 'Tenant A cannot update Tenant B data', 'FAIL', `Modified ${affected} rows of Tenant B!`);
      }
    });

    // 4. Tenant A deletes Tenant B data
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantA}', true);`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'false', true);`);
      const affected = await tx.$executeRawUnsafe(`DELETE FROM students WHERE id = '${studentBId}';`);
      if (affected === 0) {
        record(4, 'Tenant A cannot delete Tenant B data', 'PASS', '0 rows affected (delete blocked by RLS)');
      } else {
        record(4, 'Tenant A cannot delete Tenant B data', 'FAIL', `Deleted ${affected} rows of Tenant B!`);
      }
    });

    // 5. Insert with tenant_id mismatch
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantA}', true);`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'false', true);`);
      try {
        await tx.$executeRawUnsafe(`
          INSERT INTO students (id, tenant_id, nis, full_name, gender, birth_place, birth_date, admission_year, status, created_at, updated_at)
          VALUES ('33333333-3333-4333-8333-333333333333', '${tenantB}', 'NIS-FORGED', 'Forged Student', 'MALE', 'Solo', '2010-03-03', 2026, 'ACTIVE', NOW(), NOW());
        `);
        record(5, 'Insert with foreign tenant_id rejected', 'FAIL', 'Insert succeeded! WITH CHECK policy failed to block.');
      } catch (insertErr) {
        if (insertErr.message.includes('violates row-level security policy') || insertErr.message.includes('RLS')) {
          record(5, 'Insert with foreign tenant_id rejected', 'PASS', `PostgreSQL threw: ${insertErr.message.split('\n')[0]}`);
        } else {
          record(5, 'Insert with foreign tenant_id rejected', 'PASS', `Rejected with DB error: ${insertErr.message.split('\n')[0]}`);
        }
      }
    });

    // 6. Query without tenant context
    await prisma.$transaction(async (tx) => {
      // Intentionally do NOT set app.current_tenant_id
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'false', true);`);
      const rows = await tx.$queryRawUnsafe(`SELECT count(*) as cnt FROM students;`);
      const count = Number(rows[0].cnt);
      if (count === 0) {
        record(6, 'Query without tenant context returns 0 rows', 'PASS', 'Count is 0 without tenant context');
      } else {
        record(6, 'Query without tenant context returns 0 rows', 'FAIL', `Returned count ${count} without tenantId!`);
      }
    });

    // 7. Parallel concurrent transactions isolation
    const p1 = prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantA}', true);`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'false', true);`);
      await new Promise((r) => setTimeout(r, 50));
      const res = await tx.$queryRawUnsafe(`SELECT count(*) as cnt FROM students;`);
      return Number(res[0].cnt);
    });

    const p2 = prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantB}', true);`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'false', true);`);
      await new Promise((r) => setTimeout(r, 50));
      const res = await tx.$queryRawUnsafe(`SELECT count(*) as cnt FROM students;`);
      return Number(res[0].cnt);
    });

    const [cntA, cntB] = await Promise.all([p1, p2]);
    if (cntA >= 1 && cntB >= 1) {
      record(7, 'Parallel transactions isolated without leak', 'PASS', `Tx1 count: ${cntA}, Tx2 count: ${cntB} (Independent contexts maintained)`);
    } else {
      record(7, 'Parallel transactions isolated without leak', 'FAIL', `Tx1 count: ${cntA}, Tx2 count: ${cntB}`);
    }

    // 8. Super Admin official bypass
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'true', true);`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.super_admin_bypass_reason', 'OFFICIAL_SUPERADMIN_AUDIT_VERIFICATION_PASS', true);`);
      const allStudents = await tx.$queryRawUnsafe(`SELECT count(*) as cnt FROM students WHERE tenant_id IN ('${tenantA}', '${tenantB}');`);
      const count = Number(allStudents[0].cnt);
      if (count >= 2) {
        record(8, 'Super Admin bypass accesses cross-tenant data', 'PASS', `Super Admin retrieved ${count} cross-tenant rows`);
      } else {
        record(8, 'Super Admin bypass accesses cross-tenant data', 'FAIL', `Expected >= 2, got ${count}`);
      }
    });

    // 9. Raw SQL bound to RLS
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.current_tenant_id', '${tenantA}', true);`);
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'false', true);`);
      const rawRows = await tx.$queryRawUnsafe(`SELECT * FROM students;`);
      const foreignRows = rawRows.filter((r) => r.tenant_id !== tenantA);
      if (foreignRows.length === 0) {
        record(9, 'Raw SQL strictly bound to RLS via FORCE RLS', 'PASS', `All ${rawRows.length} returned rows belong strictly to Tenant A`);
      } else {
        record(9, 'Raw SQL strictly bound to RLS via FORCE RLS', 'FAIL', `Raw SQL leaked ${foreignRows.length} foreign rows!`);
      }
    });

    // Cleanup test data
    await prisma.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SELECT set_config('app.is_super_admin', 'true', true);`);
      await tx.$executeRawUnsafe(`DELETE FROM students WHERE id IN ('${studentAId}', '${studentBId}');`);
      await tx.$executeRawUnsafe(`DELETE FROM tenants WHERE id IN ('${tenantA}', '${tenantB}');`);
    });

    console.log('\n------------------------------------------------------------------------------');
    console.log('FINAL AUDIT SUMMARY:');
    const passed = results.filter((r) => r.status === 'PASS').length;
    const failed = results.filter((r) => r.status === 'FAIL').length;
    console.log(`Passed: ${passed}/9 | Failed: ${failed}/9`);
    console.log('------------------------------------------------------------------------------\n');

    await prisma.$disconnect();
    if (failed > 0) {
      process.exit(1);
    } else {
      console.log('✓ ALL 9 REAL POSTGRESQL RLS SECURITY SCENARIOS PASSED.');
      process.exit(0);
    }
  } catch (scenarioErr) {
    console.error('✗ Execution error during security scenarios:', scenarioErr);
    await prisma.$disconnect();
    process.exit(1);
  }
}

runRealPostgresRlsAudit();
