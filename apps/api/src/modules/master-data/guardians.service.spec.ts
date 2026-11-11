import { Test, TestingModule } from '@nestjs/testing';
import { GuardiansService } from './guardians.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { GuardianRelationshipType } from '@edusaas/shared-types';

describe('GuardiansService', () => {
  let service: GuardiansService;

  const mockPrisma = {
    guardian: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
    },
    studentGuardian: {
      findUnique: jest.fn(),
      create: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
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
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockAudit = {
    record: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GuardiansService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<GuardiansService>(GuardiansService);
    jest.clearAllMocks();
  });

  describe('linkStudentGuardian', () => {
    it('should reject link if student does not exist in tenant', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(null);

      await expect(
        service.linkStudentGuardian('tenant-1', {
          studentId: 's-1',
          guardianId: 'g-1',
          relationshipType: GuardianRelationshipType.FATHER,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject link if student is already linked to guardian', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 's-1' });
      mockPrisma.guardian.findFirst.mockResolvedValue({ id: 'g-1' });
      mockPrisma.studentGuardian.findUnique.mockResolvedValue({ id: 'link-1' });

      await expect(
        service.linkStudentGuardian('tenant-1', {
          studentId: 's-1',
          guardianId: 'g-1',
          relationshipType: GuardianRelationshipType.FATHER,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should link student and guardian with primary flag and permissions', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 's-1' });
      mockPrisma.guardian.findFirst.mockResolvedValue({ id: 'g-1' });
      mockPrisma.studentGuardian.findUnique.mockResolvedValue(null);
      mockPrisma.studentGuardian.updateMany.mockResolvedValue({ count: 1 });
      mockPrisma.studentGuardian.create.mockResolvedValue({
        id: 'link-new',
        studentId: 's-1',
        guardianId: 'g-1',
        relationshipType: 'FATHER',
        isPrimary: true,
        hasFinancialAccess: true,
        isEmergencyContact: true,
        receivePush: true,
        receiveWhatsapp: true,
        createdAt: new Date(),
        student: { fullName: 'Santri A', nis: '1001' },
        guardian: { fullName: 'Bapak A', phone: '08123' },
      });

      const res = await service.linkStudentGuardian('tenant-1', {
        studentId: 's-1',
        guardianId: 'g-1',
        relationshipType: GuardianRelationshipType.FATHER,
        isPrimary: true,
        hasFinancialAccess: true,
      });

      expect(res).toBeDefined();
      expect(res.isPrimary).toBe(true);
      expect(res.hasFinancialAccess).toBe(true);
      expect(mockAudit.record).toHaveBeenCalled();
    });
  });
});
