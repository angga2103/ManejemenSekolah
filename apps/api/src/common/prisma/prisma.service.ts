import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

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
   * Helper to set tenant context for RLS in transactions
   */
  async withTenantContext<T>(tenantId: string, fn: (tx: PrismaClient) => Promise<T>): Promise<T> {
    return this.$transaction(async (tx) => {
      await tx.$executeRawUnsafe(`SET LOCAL app.current_tenant_id = '${tenantId}';`);
      return fn(tx as PrismaClient);
    });
  }
}
