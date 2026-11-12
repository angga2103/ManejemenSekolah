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
      return fn(tx);
    });
  }

  /**
   * Controlled Super Admin bypass context for global SaaS administration.
   * Only permitted for verified administrative operations with audit trail.
   */
  async withSuperAdminContext<T>(
    fn: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    this.logger.warn('[RLS-BYPASS] Super Admin database session bypass activated');
    return this.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT set_config('app.is_super_admin', ${'true'}, true)`;
      return fn(tx);
    });
  }
}
