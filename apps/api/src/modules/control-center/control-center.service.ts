import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  SystemMetricsResponseData,
  TenantControlSummaryResponseData,
  UpdateTenantStatusDto,
} from '@edusaas/api-contracts';
import {
  TenantStatus,
  SubscriptionTier,
  SystemHealthStatus,
} from '@edusaas/shared-types';

@Injectable()
export class ControlCenterService {
  private readonly logger = new Logger(ControlCenterService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Aggregate real-time system performance, database latency, and SaaS metrics
   */
  async getSystemMetrics(): Promise<SystemMetricsResponseData> {
    const mem = process.memoryUsage();
    const memory = {
      rssMb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heapTotalMb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
      heapUsedMb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      externalMb: Math.round((mem.external / 1024 / 1024) * 100) / 100,
    };

    // Database ping & latency check
    let dbStatus: 'ONLINE' | 'DEGRADED' | 'OFFLINE' = 'ONLINE';
    let latencyMs = 0;
    try {
      const start = Date.now();
      await this.prisma.$queryRaw`SELECT 1`;
      latencyMs = Date.now() - start;
      if (latencyMs > 500) {
        dbStatus = 'DEGRADED';
      }
    } catch (err) {
      this.logger.error(`Database health check failed: ${err.message}`);
      dbStatus = 'OFFLINE';
    }

    // Tenant counts
    const [
      totalTenants,
      activeTenants,
      trialTenants,
      suspendedTenants,
      terminatedTenants,
    ] = await Promise.all([
      this.prisma.tenant.count({ where: { deletedAt: null } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.ACTIVE as any, deletedAt: null } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.TRIAL as any, deletedAt: null } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.SUSPENDED as any, deletedAt: null } }),
      this.prisma.tenant.count({ where: { status: TenantStatus.TERMINATED as any, deletedAt: null } }),
    ]);

    // Subscriptions by tier
    const [basicCount, standardCount, premiumCount, enterpriseCount] = await Promise.all([
      this.prisma.tenantSubscription.count({ where: { tier: SubscriptionTier.BASIC as any, isActive: true } }),
      this.prisma.tenantSubscription.count({ where: { tier: SubscriptionTier.STANDARD as any, isActive: true } }),
      this.prisma.tenantSubscription.count({ where: { tier: SubscriptionTier.PREMIUM as any, isActive: true } }),
      this.prisma.tenantSubscription.count({ where: { tier: SubscriptionTier.ENTERPRISE as any, isActive: true } }),
    ]);

    // Global totals
    const [
      totalStudents,
      totalUsers,
      totalInvoices,
      totalAttendances,
      totalPayments,
      totalClasses,
      totalSubjects,
      totalGrades,
      totalReportCards,
      totalDormitories,
      totalTahfiz,
      totalViolations,
      totalAchievements,
      totalCounseling,
      totalComplaints,
      totalAuditLogs,
    ] = await Promise.all([
      this.prisma.student.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.invoice.count(),
      this.prisma.attendance.count(),
      this.prisma.payment.count(),
      this.prisma.classGroup.count(),
      this.prisma.subject.count(),
      this.prisma.grade.count(),
      this.prisma.reportCard.count(),
      this.prisma.dormitory.count(),
      this.prisma.tahfizRecord.count(),
      this.prisma.studentViolation.count(),
      this.prisma.studentAchievement.count(),
      this.prisma.counselingRecord.count(),
      this.prisma.complaintTicket.count(),
      this.prisma.auditLog.count(),
    ]);

    const status: SystemHealthStatus =
      dbStatus === 'OFFLINE'
        ? SystemHealthStatus.CRITICAL
        : dbStatus === 'DEGRADED' || memory.heapUsedMb > 1500
        ? SystemHealthStatus.DEGRADED
        : SystemHealthStatus.HEALTHY;

    return {
      status,
      uptimeSeconds: Math.floor(process.uptime()),
      memory,
      database: {
        status: dbStatus,
        latencyMs,
      },
      tenants: {
        total: totalTenants,
        byStatus: {
          active: activeTenants,
          trial: trialTenants,
          suspended: suspendedTenants,
          terminated: terminatedTenants,
        },
        byTier: {
          basic: basicCount,
          standard: standardCount,
          premium: premiumCount,
          enterprise: enterpriseCount,
        },
      },
      totals: {
        students: totalStudents,
        users: totalUsers,
        invoices: totalInvoices,
        attendances: totalAttendances,
      },
      tableCounts: {
        tenants: totalTenants,
        students: totalStudents,
        users: totalUsers,
        classes: totalClasses,
        subjects: totalSubjects,
        attendances: totalAttendances,
        invoices: totalInvoices,
        payments: totalPayments,
        grades: totalGrades,
        reportCards: totalReportCards,
        dormitories: totalDormitories,
        tahfizRecords: totalTahfiz,
        violations: totalViolations,
        achievements: totalAchievements,
        counseling: totalCounseling,
        complaints: totalComplaints,
        auditLogs: totalAuditLogs,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * List tenants with quota usage and subscription details for Control Center
   */
  async listTenantsSummary(params?: {
    search?: string;
    status?: TenantStatus;
    tier?: SubscriptionTier;
  }): Promise<TenantControlSummaryResponseData[]> {
    const where: any = { deletedAt: null };

    if (params?.status) {
      where.status = params.status;
    }

    if (params?.search) {
      const q = params.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { slug: { contains: q, mode: 'insensitive' } },
        { subdomain: { contains: q, mode: 'insensitive' } },
      ];
    }

    const tenants = await this.prisma.tenant.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        subscriptions: {
          where: { isActive: true },
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            students: { where: { deletedAt: null } },
            users: { where: { deletedAt: null } },
          },
        },
      },
    });

    const now = new Date();

    return tenants
      .filter((t) => {
        if (!params?.tier) return true;
        const sub = t.subscriptions[0];
        return sub && sub.tier === params.tier;
      })
      .map((t) => {
        const sub = t.subscriptions[0];
        const studentCount = t._count.students;
        const userCount = t._count.users;

        let subInfo = null;
        let quotaUsagePercentage = 0;

        if (sub) {
          const diffTime = sub.endDate.getTime() - now.getTime();
          const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
          quotaUsagePercentage = sub.maxStudents > 0
            ? Math.min(100, Math.round((studentCount / sub.maxStudents) * 100))
            : 0;

          subInfo = {
            id: sub.id,
            tier: sub.tier as unknown as SubscriptionTier,
            maxStudents: sub.maxStudents,
            enabledModules: sub.enabledModules,
            startDate: sub.startDate,
            endDate: sub.endDate,
            isActive: sub.isActive,
            daysRemaining,
          };
        }

        return {
          id: t.id,
          name: t.name,
          slug: t.slug,
          subdomain: t.subdomain,
          customDomain: t.customDomain,
          status: t.status as unknown as TenantStatus,
          studentCount,
          userCount,
          quotaUsagePercentage,
          subscription: subInfo,
          createdAt: t.createdAt,
        };
      });
  }

  /**
   * Update tenant status (ACTIVE, SUSPENDED, TERMINATED) with audit logging
   */
  async updateTenantStatus(
    tenantId: string,
    dto: UpdateTenantStatusDto,
    superAdminUserId?: string,
  ) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }

    const updated = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { status: dto.status as any },
    });

    await this.auditService.record({
      tenantId,
      userId: superAdminUserId || null,
      action: 'TENANT_STATUS_CHANGED',
      resource: 'tenants',
      resourceId: tenantId,
      oldValues: { status: tenant.status },
      newValues: { status: dto.status, reason: dto.reason || 'SaaS Control Center change' },
    });

    return updated;
  }

  /**
   * Query cross-tenant audit trail for Super Admin inspection
   */
  async getCrossTenantAuditLogs(limit = 100, tenantId?: string) {
    const where: any = {};
    if (tenantId) {
      where.tenantId = tenantId;
    }

    return this.prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: Math.min(200, limit),
      include: {
        tenant: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
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
