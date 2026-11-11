import { Test, TestingModule } from '@nestjs/testing';
import { RbacService } from './rbac.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { SystemRoleSlug } from '@edusaas/shared-types';

describe('RbacService', () => {
  let service: RbacService;

  const mockPrisma = {
    permission: {
      findMany: jest.fn(),
    },
    role: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      upsert: jest.fn(),
    },
    rolePermission: {
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RbacService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<RbacService>(RbacService);
    jest.clearAllMocks();
  });

  describe('getPermissionsCatalog', () => {
    it('should return permissions catalog', async () => {
      mockPrisma.permission.findMany.mockResolvedValue([
        { id: 'p-1', module: 'STUDENTS', action: 'VIEW', description: 'View students' },
      ]);

      const perms = await service.getPermissionsCatalog();
      expect(perms).toHaveLength(1);
      expect(perms[0].module).toBe('STUDENTS');
      expect(perms[0].action).toBe('VIEW');
    });

    it('should fallback to generated enum permissions if DB is empty', async () => {
      mockPrisma.permission.findMany.mockResolvedValue([]);

      const perms = await service.getPermissionsCatalog();
      expect(perms.length).toBeGreaterThan(0);
      expect(perms.some((p) => p.module === 'ATTENDANCE' && p.action === 'CREATE')).toBe(true);
    });
  });

  describe('getRoleById', () => {
    it('should throw NotFoundException if role does not belong to tenant', async () => {
      mockPrisma.role.findFirst.mockResolvedValue(null);

      await expect(service.getRoleById('tenant-1', 'invalid-role-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createRole', () => {
    it('should reject creation if role slug already exists in tenant', async () => {
      mockPrisma.role.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.createRole('tenant-1', {
          name: 'Custom Teacher',
          slug: 'custom-teacher',
          permissionIds: [],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('provisionStandardRolesForTenant', () => {
    it('should upsert all 12 system roles for new tenant', async () => {
      mockPrisma.role.upsert.mockResolvedValue({});

      await service.provisionStandardRolesForTenant('new-tenant-123');

      expect(mockPrisma.role.upsert).toHaveBeenCalledTimes(12);
    });
  });
});
