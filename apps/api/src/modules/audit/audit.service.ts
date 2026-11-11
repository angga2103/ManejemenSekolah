import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

export interface CreateAuditLogParams {
  tenantId: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async record(params: CreateAuditLogParams) {
    try {
      this.logger.log(
        `[AUDIT] Tenant: ${params.tenantId} | User: ${params.userId || 'system'} | Action: ${params.action} | Resource: ${params.resource}`,
      );

      return await this.prisma.auditLog.create({
        data: {
          tenantId: params.tenantId,
          userId: params.userId,
          action: params.action,
          resource: params.resource,
          resourceId: params.resourceId,
          oldValues: params.oldValues as any,
          newValues: params.newValues as any,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      // In offline/mock mode or if DB write fails, log warning without breaking the transaction
      this.logger.warn(`Failed to persist audit log to DB: ${error.message}`);
      return null;
    }
  }

  async getRecentLogs(tenantId: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    });
  }
}
