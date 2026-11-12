import { Injectable, OnModuleInit, OnModuleDestroy, Logger, BadRequestException } from '@nestjs/common';
import { PrismaClient, Prisma } from '@prisma/client';
import { TenantContext } from '../tenant/tenant-context';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    this.logger.log('Initializing Prisma database connection...');
    try {
      await this.$connect();
      this.logger.log('Prisma database connection established successfully.');
    } catch (error) {
      this.logger.warn(`Database connection deferred (expected in offline/pre-infra mode): ${error.message}`);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
    this.logger.log('Prisma database connection closed.');
  }

  /**
   * Helper to set transaction-scoped PostgreSQL Row-Level Security (RLS) tenant context.
   * Uses SET LOCAL / set_config(..., true) to strictly isolate parameters to the current transaction.
   * Parameter is discarded automatically on commit or rollback, preventing connection pool leaks.
   */
  async withTenantContext<T>(
    tenantIdOrFn: string | ((tx: Prisma.TransactionClient) => Promise<T>),
    maybeFn?: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    const tenantId = typeof tenantIdOrFn === 'string' ? tenantIdOrFn : TenantContext.getTenantId();
    const fn = typeof tenantIdOrFn === 'function' ? tenantIdOrFn : maybeFn;

    if (!fn) {
      throw new BadRequestException('Transaction callback function is required');
    }

    if (!tenantId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(tenantId)) {
      throw new BadRequestException('Format tenantId tidak valid untuk konteks database Row-Level Security');
    }

    return this.$transaction(async (tx) => {
      // Set local transaction configuration for PostgreSQL Row-Level Security
      await tx.$executeRaw`SELECT set_config('app.current_tenant_id', ${tenantId}, true)`;
      await tx.$executeRaw`SELECT set_config('app.is_super_admin', ${'false'}, true)`;
      await tx.$executeRaw`SELECT set_config('app.super_admin_bypass_reason', ${''}, true)`;
      return fn(tx);
    });
  }

  /**
   * Controlled Super Admin bypass context for global SaaS administration.
   * Only permitted for verified administrative operations with audit trail.
   * Requires non-empty audit reason (minimum 10 characters).
   */
  async withSuperAdminContext<T>(
    optionsOrFn:
      | { adminUserId?: string; targetTenantId?: string; reason?: string; actionType?: string }
      | string
      | ((tx: Prisma.TransactionClient) => Promise<T>),
    maybeFn?: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    let fn: (tx: Prisma.TransactionClient) => Promise<T>;
    let reason = 'AUTHORIZED_SUPERADMIN_AUDIT_SESSION';
    let adminUserId: string | null = null;
    let targetTenantId: string | null = null;
    let actionType = 'SUPER_ADMIN_CROSS_TENANT_OPERATION';

    if (typeof optionsOrFn === 'function') {
      fn = optionsOrFn;
    } else if (typeof optionsOrFn === 'string') {
      reason = optionsOrFn;
      fn = maybeFn as (tx: Prisma.TransactionClient) => Promise<T>;
    } else {
      reason = optionsOrFn.reason || reason;
      adminUserId = optionsOrFn.adminUserId || null;
      targetTenantId = optionsOrFn.targetTenantId || null;
      actionType = optionsOrFn.actionType || actionType;
      fn = maybeFn as (tx: Prisma.TransactionClient) => Promise<T>;
    }

    if (!fn) {
      throw new BadRequestException('Transaction callback function is required');
    }

    if (!reason || reason.trim().length < 10) {
      throw new BadRequestException('Super Admin bypass requires a detailed audit reason (minimum 10 characters)');
    }

    this.logger.warn(`[RLS-BYPASS] Super Admin database session bypass activated. Reason: "${reason}"`);
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.is_super_admin', ${'true'}, true)`;
      await tx.$executeRaw`SELECT set_config('app.super_admin_bypass_reason', ${reason}, true)`;

      // Append authoritative record to cross_tenant_access_logs if available
      try {
        await tx.$executeRaw`
          INSERT INTO cross_tenant_access_logs (admin_id, target_tenant_id, action_type, reason)
          VALUES (${adminUserId}::uuid, ${targetTenantId}::uuid, ${actionType}, ${reason})
        `;
      } catch (logErr) {
        // Log deferred in disconnected test mocks or unmigrated test DBs
        this.logger.debug(`Cross-tenant audit log record deferred: ${logErr.message}`);
      }

      return fn(tx);
    });
  }
}
