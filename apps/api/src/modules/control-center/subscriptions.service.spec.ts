import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SubscriptionsService } from './subscriptions.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { SubscriptionTier, TenantStatus, SaaSModuleKey } from '@edusaas/shared-types';

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;
  let prisma: any;
  let audit: any;

  const mockTenantId = 'tenant-uuid-1234';
  const mockSubId = 'sub-uuid-5678';
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);

  const mockSubscription = {
    id: mockSubId,
    tenantId: mockTenantId,
    tier: SubscriptionTier.STANDARD,
    maxStudents: 1000,
    enabledModules: [
      SaaSModuleKey.MASTER_DATA,
      SaaSModuleKey.ATTENDANCE,
      SaaSModuleKey.FINANCE,
      SaaSModuleKey.ACADEMICS,
    ],
    startDate: new Date(),
    endDate: futureDate,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      tenant: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      tenantSubscription: {
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    audit = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockReturnValue('test-secret-min-32-chars-long-12345'),
          },
        },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getTenantSubscription', () => {
    it('should return active subscription details with days remaining', async () => {
      prisma.tenantSubscription.findFirst.mockResolvedValue(mockSubscription);

      const result = await service.getTenantSubscription(mockTenantId);
      expect(result).toBeDefined();
      expect(result.id).toBe(mockSubId);
      expect(result.tier).toBe(SubscriptionTier.STANDARD);
      expect(result.daysRemaining).toBeGreaterThan(300);
      expect(result.enabledModules).toContain(SaaSModuleKey.ATTENDANCE);
    });

    it('should throw NotFoundException if no active subscription exists', async () => {
      prisma.tenantSubscription.findFirst.mockResolvedValue(null);

      await expect(service.getTenantSubscription(mockTenantId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('renewSubscription', () => {
    it('should extend subscription end date and update tier & quota', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: mockTenantId,
        status: TenantStatus.TRIAL,
        subscriptions: [mockSubscription],
      });
      prisma.tenantSubscription.update.mockResolvedValue({
        ...mockSubscription,
        tier: SubscriptionTier.PREMIUM,
        maxStudents: 2000,
      });
      prisma.tenant.update.mockResolvedValue({ id: mockTenantId, status: TenantStatus.ACTIVE });
      prisma.tenantSubscription.findFirst.mockResolvedValue({
        ...mockSubscription,
        tier: SubscriptionTier.PREMIUM,
        maxStudents: 2000,
      });

      const result = await service.renewSubscription(mockTenantId, {
        months: 12,
        tier: SubscriptionTier.PREMIUM,
        maxStudents: 2000,
      });

      expect(prisma.tenantSubscription.update).toHaveBeenCalled();
      expect(prisma.tenant.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: { status: TenantStatus.ACTIVE },
        }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'SUBSCRIPTION_RENEWED' }),
      );
      expect(result.tier).toBe(SubscriptionTier.PREMIUM);
    });
  });

  describe('updateModules', () => {
    it('should update enabled modules when valid keys are provided', async () => {
      prisma.tenantSubscription.findFirst.mockResolvedValue(mockSubscription);
      prisma.tenantSubscription.update.mockResolvedValue({
        ...mockSubscription,
        enabledModules: [SaaSModuleKey.ATTENDANCE, SaaSModuleKey.PESANTREN, SaaSModuleKey.LMS_CBT],
      });

      const result = await service.updateModules(mockTenantId, [
        SaaSModuleKey.ATTENDANCE,
        SaaSModuleKey.PESANTREN,
        SaaSModuleKey.LMS_CBT,
      ]);

      expect(prisma.tenantSubscription.update).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MODULE_FLAGS_UPDATED' }),
      );
      expect(result).toBeDefined();
    });

    it('should throw BadRequestException if an invalid module key is passed', async () => {
      prisma.tenantSubscription.findFirst.mockResolvedValue(mockSubscription);

      await expect(
        service.updateModules(mockTenantId, ['INVALID_MODULE_XYZ']),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyModuleAccess', () => {
    it('should allow access if tenant is ACTIVE and module is in enabledModules', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: mockTenantId,
        status: TenantStatus.ACTIVE,
        subscriptions: [mockSubscription],
      });

      const check = await service.verifyModuleAccess(mockTenantId, SaaSModuleKey.ATTENDANCE);
      expect(check.allowed).toBe(true);
    });

    it('should deny access if tenant is SUSPENDED', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: mockTenantId,
        status: TenantStatus.SUSPENDED,
        subscriptions: [mockSubscription],
      });

      const check = await service.verifyModuleAccess(mockTenantId, SaaSModuleKey.ATTENDANCE);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('suspended');
    });

    it('should deny access if module is not in enabledModules', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: mockTenantId,
        status: TenantStatus.ACTIVE,
        subscriptions: [mockSubscription],
      });

      const check = await service.verifyModuleAccess(mockTenantId, SaaSModuleKey.DORMITORY);
      expect(check.allowed).toBe(false);
      expect(check.reason).toContain('not enabled');
    });
  });

  describe('generateLicenseKey', () => {
    it('should generate a signed license key string', async () => {
      prisma.tenant.findUnique.mockResolvedValue({
        id: mockTenantId,
        slug: 'pesantren-annur',
        subscriptions: [mockSubscription],
      });

      const result = await service.generateLicenseKey(mockTenantId);
      expect(result).toBeDefined();
      expect(result.licenseKey).toMatch(/^EDU-STANDARD-PESANTREN-ANNUR-/);
      expect(result.signature).toBeDefined();
      expect(result.validUntil).toBeDefined();
    });
  });
});
