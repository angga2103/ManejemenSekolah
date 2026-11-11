import { PrismaClient, TenantStatus, SubscriptionTier } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import {
  PermissionModule,
  PermissionAction,
  SystemRoleSlug,
} from '@edusaas/shared-types';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seed for School & Pesantren SaaS...');

  // 1. SEED PERMISSIONS CATALOG
  console.log('📦 Seeding permissions catalog...');
  const modules = Object.values(PermissionModule);
  const actions = Object.values(PermissionAction);

  let permissionCount = 0;
  for (const module of modules) {
    for (const action of actions) {
      await prisma.permission.upsert({
        where: {
          module_action: { module, action },
        },
        create: {
          module,
          action,
          description: `Permission to ${action} on ${module}`,
        },
        update: {},
      });
      permissionCount++;
    }
  }
  console.log(`✅ Seeded ${permissionCount} granular permissions.`);

  // 2. SEED DEMO TENANT
  console.log('🏛️ Seeding demo tenant: Pesantren & SMA Al-Hikmah...');
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'al-hikmah' },
    create: {
      name: 'SMA & Pondok Pesantren Al-Hikmah Digital',
      slug: 'al-hikmah',
      subdomain: 'alhikmah',
      status: TenantStatus.ACTIVE,
    },
    update: {
      name: 'SMA & Pondok Pesantren Al-Hikmah Digital',
      subdomain: 'alhikmah',
      status: TenantStatus.ACTIVE,
    },
  });

  // Tenant Settings
  await prisma.tenantSettings.upsert({
    where: { tenantId: tenant.id },
    create: {
      tenantId: tenant.id,
      primaryColor: '#059669', // Emerald Green (Islamic Identity)
      timezone: 'Asia/Jakarta',
      dateFormat: 'DD/MM/YYYY',
      currency: 'IDR',
      isFormalEnabled: true,
      isPesantrenEnabled: true,
    },
    update: {
      primaryColor: '#059669',
      isFormalEnabled: true,
      isPesantrenEnabled: true,
    },
  });

  // Tenant Subscription
  const startDate = new Date();
  const endDate = new Date();
  endDate.setFullYear(endDate.getFullYear() + 1);

  const existingSub = await prisma.tenantSubscription.findFirst({
    where: { tenantId: tenant.id, isActive: true },
  });

  if (!existingSub) {
    await prisma.tenantSubscription.create({
      data: {
        tenantId: tenant.id,
        tier: SubscriptionTier.PREMIUM,
        maxStudents: 2000,
        enabledModules: modules,
        startDate,
        endDate,
        isActive: true,
      },
    });
  }

  // 3. SEED 12 SYSTEM ROLES FOR TENANT
  console.log('🛡️ Seeding 12 system roles...');
  const systemRoles = [
    {
      slug: SystemRoleSlug.SUPER_ADMIN,
      name: 'SaaS Super Admin',
      description: 'Platform owner with global governance access',
    },
    {
      slug: SystemRoleSlug.PRINCIPAL,
      name: 'Principal / Head of Pesantren',
      description: 'Executive leadership with comprehensive institutional access',
    },
    {
      slug: SystemRoleSlug.VICE_PRINCIPAL,
      name: 'Vice Principal / Caretaker',
      description: 'Academic and pesantren operational supervisor',
    },
    {
      slug: SystemRoleSlug.OPERATOR,
      name: 'Operator / Administration',
      description: 'Administration and master data records',
    },
    {
      slug: SystemRoleSlug.TREASURER,
      name: 'Treasurer / Finance',
      description: 'Tuition billing, cash accounts, and journals',
    },
    {
      slug: SystemRoleSlug.HOMEROOM_TEACHER,
      name: 'Homeroom Teacher',
      description: 'Classroom manager and report card issuer',
    },
    {
      slug: SystemRoleSlug.SUBJECT_TEACHER,
      name: 'Subject Teacher',
      description: 'Curriculum delivery, assignments, and CBT exams',
    },
    {
      slug: SystemRoleSlug.USTAZ,
      name: 'Ustaz / Ustazah',
      description: 'Diniyah and religious studies instructor',
    },
    {
      slug: SystemRoleSlug.MUSYRIF,
      name: 'Dormitory Supervisor / Musyrif',
      description: 'Boarding house caretaker and Tahfiz evaluator',
    },
    {
      slug: SystemRoleSlug.SECURITY,
      name: 'Attendance Officer / Security',
      description: 'Gate scanning and attendance verification officer',
    },
    {
      slug: SystemRoleSlug.STUDENT,
      name: 'Student / Santri',
      description: 'Student portal, dynamic QR identity, and academic logs',
    },
    {
      slug: SystemRoleSlug.PARENT,
      name: 'Parent / Guardian',
      description: 'Guardian portal, tuition payments, and attendance tracking',
    },
  ];

  const roleMap: Record<string, string> = {};

  for (const r of systemRoles) {
    const roleRecord = await prisma.role.upsert({
      where: {
        tenantId_slug: { tenantId: tenant.id, slug: r.slug },
      },
      create: {
        tenantId: tenant.id,
        name: r.name,
        slug: r.slug,
        isSystem: true,
        description: r.description,
      },
      update: {
        name: r.name,
        description: r.description,
      },
    });
    roleMap[r.slug] = roleRecord.id;
  }

  // 4. SEED DEMO USERS (Password: Password123!)
  console.log('👥 Seeding demo user accounts with bcrypt hashes...');
  const defaultPasswordHash = await bcrypt.hash('Password123!', 10);

  const demoUsers = [
    {
      email: 'admin@alhikmah.sch.id',
      fullName: 'Dr. KH. Ahmad Fauzi, M.Ag',
      phone: '081234567890',
      roleSlug: SystemRoleSlug.PRINCIPAL,
    },
    {
      email: 'operator@alhikmah.sch.id',
      fullName: 'Nur Hidayah, S.Kom',
      phone: '081234567891',
      roleSlug: SystemRoleSlug.OPERATOR,
    },
    {
      email: 'bendahara@alhikmah.sch.id',
      fullName: 'Siti Aminah, S.E',
      phone: '081234567892',
      roleSlug: SystemRoleSlug.TREASURER,
    },
    {
      email: 'guru@alhikmah.sch.id',
      fullName: 'Muhammad Ridwan, S.Pd',
      phone: '081234567893',
      roleSlug: SystemRoleSlug.SUBJECT_TEACHER,
    },
    {
      email: 'musyrif@alhikmah.sch.id',
      fullName: 'Ustaz Wildan Al-Hafiz',
      phone: '081234567894',
      roleSlug: SystemRoleSlug.MUSYRIF,
    },
    {
      email: 'satpam@alhikmah.sch.id',
      fullName: 'Bambang Sudirgo',
      phone: '081234567895',
      roleSlug: SystemRoleSlug.SECURITY,
    },
    {
      email: 'santri@alhikmah.sch.id',
      fullName: 'Ahmad Bilal Al-Ghifari',
      phone: '081234567896',
      roleSlug: SystemRoleSlug.STUDENT,
    },
    {
      email: 'wali@alhikmah.sch.id',
      fullName: 'H. Suryadi Rahman',
      phone: '081234567897',
      roleSlug: SystemRoleSlug.PARENT,
    },
  ];

  for (const u of demoUsers) {
    const user = await prisma.user.upsert({
      where: {
        tenantId_email: { tenantId: tenant.id, email: u.email },
      },
      create: {
        tenantId: tenant.id,
        email: u.email,
        phone: u.phone,
        fullName: u.fullName,
        passwordHash: defaultPasswordHash,
        isActive: true,
      },
      update: {
        fullName: u.fullName,
        phone: u.phone,
        passwordHash: defaultPasswordHash,
        isActive: true,
      },
    });

    const roleId = roleMap[u.roleSlug];
    if (roleId) {
      const existingUserRole = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId },
      });

      if (!existingUserRole) {
        await prisma.userRole.create({
          data: {
            userId: user.id,
            roleId,
          },
        });
      }
    }
  }

  console.log('🎉 Database seed completed successfully!');
  console.log('---------------------------------------------------------');
  console.log('Demo Credentials for all accounts:');
  console.log('Default Password: Password123!');
  console.log('Subdomain / Code : alhikmah');
  console.log('Principal        : admin@alhikmah.sch.id');
  console.log('Operator         : operator@alhikmah.sch.id');
  console.log('Treasurer        : bendahara@alhikmah.sch.id');
  console.log('Teacher          : guru@alhikmah.sch.id');
  console.log('Musyrif          : musyrif@alhikmah.sch.id');
  console.log('Security Scan    : satpam@alhikmah.sch.id');
  console.log('Santri / Student : santri@alhikmah.sch.id');
  console.log('Parent / Wali    : wali@alhikmah.sch.id');
  console.log('---------------------------------------------------------');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
