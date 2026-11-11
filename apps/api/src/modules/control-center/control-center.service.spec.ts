import { Test, TestingModule } from '@nestjs/testing';
import { ControlCenterService } from './control-center.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { TenantStatus, SubscriptionTier, SystemHealthStatus } from '@edusaas/shared-types';

describe('ControlCenterService', () => {
  let service: ControlCenterService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn().mockResolvedValue([{ 1: 1 }]),
      tenant: {
        count: jest.fn().mockResolvedValue(10),
        findMany: jest.fn().mockResolvedValue([]),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenantSubscription: {
        count: jest.fn().mockResolvedValue(5),
      },
      student: { count: jest.fn().mockResolvedValue(1500) },
      user: { count: jest.fn().mockResolvedValue(200) },
      invoice: { count: jest.fn().mockResolvedValue(500) },
      attendance: { count: jest.fn().mockResolvedValue(12000) },
      payment: { count: jest.fn().mockResolvedValue(450) },
      classGroup: { count: jest.fn().mockResolvedValue(40) },
      subject: { count: jest.fn().mockResolvedValue(80) },
      grade: { count: jest.fn().mockResolvedValue(3200) },
      reportCard: { count: jest.fn().mockResolvedValue(300) },
      dormitory: { count: jest.fn().mockResolvedValue(8) },
      tahfizRecord: { count: jest.fn().mockResolvedValue(1200) },
      studentViolation: { count: jest.fn().mockResolvedValue(45) },
      studentAchievement: { count: jest.fn().mockResolvedValue(60) },
      counselingRecord: { count: jest.fn().mockResolvedValue(30) },
      complaintTicket: { count: jest.fn().mockResolvedValue(25) },
      auditLog: {
        count: jest.fn().mockResolvedValue(5400),
        findMany: jest.fn().mockResolvedValue([]),
      },
    };

    audit = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ControlCenterService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<ControlCenterService>(ControlCenterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getSystemMetrics', () => {
    it('should aggregate SaaS metrics, memory usage and database health', async () => {
      const metrics = await service.getSystemMetrics();

      expect(metrics).toBeDefined();
      expect(metrics.status).toBe(SystemHealthStatus.HEALTHY);
      expect(metrics.database.status).toBe('ONLINE');
      expect(metrics.memory.heapUsedMb).toBeGreaterThan(0);
      expect(metrics.tenants.total).toBe(10);
      expect(metrics.totals.students).toBe(1500);
      expect(metrics.tableCounts.invoices).toBe(500);
      expect(metrics.tableCounts.attendances).toBe(12000);
    });
  });

  describe('listTenantsSummary', () => {
    it('should calculate quota percentage for institutions', async () => {
      const mockTenants = [
        {
          id: 'tenant-1',
          name: 'Pesantren Al-Hikmah',
          slug: 'al-hikmah',
          subdomain: 'alhikmah',
          customDomain: null,
          status: TenantStatus.ACTIVE,
          createdAt: new Date(),
          subscriptions: [
            {
              id: 'sub-1',
              tier: SubscriptionTier.STANDARD,
              maxStudents: 1000,
              enabledModules: ['ATTENDANCE', 'FINANCE'],
              startDate: new Date(),
              endDate: new Date(Date.now() + 86400000 * 30),
              isActive: true,
            },
          ],
          _count: {
            students: 750,
            users: 50,
          },
        },
      ];

      prisma.tenant.findMany.mockResolvedValue(mockTenants);

      const list = await service.listTenantsSummary();
      expect(list).toHaveLength(1);
      expect(list[0].quotaUsagePercentage).toBe(75);
      expect(list[0].subscription?.daysRemaining).toBe(30);
    });
  });

  describe('updateTenantStatus', () => {
    it('should update tenant status and write audit log', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: 'tenant-1',
        status: TenantStatus.ACTIVE,
      });
      prisma.tenant.update.mockResolvedValue({
        id: 'tenant-1',
        status: TenantStatus.SUSPENDED,
      });

      const updated = await service.updateTenantStatus('tenant-1', {
        status: TenantStatus.SUSPENDED,
        reason: 'Payment overdue',
      });

      expect(prisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: TenantStatus.SUSPENDED },
        }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'TENANT_STATUS_CHANGED',
        }),
      );
      expect(updated.status).toBe(TenantStatus.SUSPENDED);
    });
  });

  describe('getCrossTenantAuditLogs', () => {
    it('should fetch audit logs with user and tenant details', async () => {
      const mockLogs = [
        {
          id: 'log-1',
          action: 'LOGIN',
          tenant: { name: 'Pesantren Al-Hikmah', slug: 'alhikmah' },
          user: { fullName: 'Admin Ustadz' },
        },
      ];
      prisma.auditLog.findMany.mockResolvedValue(mockLogs);

      const logs = await service.getCrossTenantAuditLogs(50);
      expect(logs).toHaveLength(1);
      expect(prisma.auditLog.findMany).toHaveBeenCalled();
    });
  });
});
