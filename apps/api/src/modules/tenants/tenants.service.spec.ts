import { Test, TestingModule } from '@nestjs/testing';
import { TenantsService } from './tenants.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { AuditService } from '../audit/audit.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { TenantStatus, SubscriptionTier } from '@edusaas/shared-types';

describe('TenantsService', () => {
  let service: TenantsService;

  const mockPrisma = {
    tenant: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    tenantSettings: {
      create: jest.fn(),
      upsert: jest.fn(),
      findUnique: jest.fn(),
    },
    tenantSubscription: {
      create: jest.fn(),
    },
    user: {
      create: jest.fn(),
    },
    role: {
      findFirst: jest.fn(),
    },
    userRole: {
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  const mockRbac = {
    provisionStandardRolesForTenant: jest.fn().mockResolvedValue(null),
  };

  const mockAudit = {
    record: jest.fn().mockResolvedValue(null),
  };

  const mockJwt = {
    sign: jest.fn().mockReturnValue('mock_jwt_token'),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('secret'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RbacService, useValue: mockRbac },
        { provide: AuditService, useValue: mockAudit },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<TenantsService>(TenantsService);
    jest.clearAllMocks();
  });

  describe('registerTenant', () => {
    it('should reject registration if slug is already taken', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({
        id: 'existing-id',
        slug: 'al-hikmah',
        subdomain: 'alhikmah-other',
      });

      await expect(
        service.registerTenant({
          name: 'Pesantren Al-Hikmah',
          slug: 'al-hikmah',
          subdomain: 'alhikmah',
          adminFullName: 'KH. Abdullah',
          adminEmail: 'abdullah@alhikmah.id',
          adminPassword: 'Password123!',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should register tenant successfully when slug and subdomain are available', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);

      const fakeTenant = {
        id: 'new-tenant-id',
        name: 'Pesantren Al-Hikmah',
        slug: 'al-hikmah',
        subdomain: 'alhikmah',
        status: TenantStatus.TRIAL,
        createdAt: new Date(),
      };

      const fakeAdminUser = {
        id: 'admin-user-id',
        email: 'abdullah@alhikmah.id',
        fullName: 'KH. Abdullah',
      };

      mockPrisma.$transaction.mockResolvedValue({
        tenant: fakeTenant,
        adminUser: fakeAdminUser,
      });

      mockPrisma.role.findFirst.mockResolvedValue({ id: 'principal-role-id' });
      mockPrisma.userRole.create.mockResolvedValue({});

      const result = await service.registerTenant({
        name: 'Pesantren Al-Hikmah',
        slug: 'al-hikmah',
        subdomain: 'alhikmah',
        adminFullName: 'KH. Abdullah',
        adminEmail: 'abdullah@alhikmah.id',
        adminPassword: 'Password123!',
      });

      expect(result).toBeDefined();
      expect(result.tenant.id).toBe('new-tenant-id');
      expect(result.adminUser.email).toBe('abdullah@alhikmah.id');
      expect(result.tokens.accessToken).toBe('mock_jwt_token');
      expect(mockRbac.provisionStandardRolesForTenant).toHaveBeenCalledWith('new-tenant-id');
      expect(mockAudit.record).toHaveBeenCalled();
    });
  });

  describe('resolvePublicInfo', () => {
    it('should resolve tenant branding by subdomain', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue({
        id: 't-1',
        name: 'SMA Al-Hikmah',
        slug: 'al-hikmah',
        subdomain: 'alhikmah',
        settings: {
          logoUrl: 'https://cdn.example.com/logo.png',
          primaryColor: '#059669',
          timezone: 'Asia/Jakarta',
          currency: 'IDR',
          isFormalEnabled: true,
          isPesantrenEnabled: true,
        },
      });

      const res = await service.resolvePublicInfo('alhikmah');
      expect(res.name).toBe('SMA Al-Hikmah');
      expect(res.primaryColor).toBe('#059669');
      expect(res.isPesantrenEnabled).toBe(true);
    });

    it('should throw NotFoundException if institution does not exist', async () => {
      mockPrisma.tenant.findFirst.mockResolvedValue(null);

      await expect(service.resolvePublicInfo('unknown-school')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
