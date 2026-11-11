import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { Gender, StudentStatus } from '@edusaas/shared-types';

describe('StudentsService', () => {
  let service: StudentsService;

  const mockPrisma = {
    student: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    classStudent: {
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback(mockPrisma)),
  };

  const mockAudit = {
    record: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
    jest.clearAllMocks();
  });

  describe('createStudent', () => {
    it('should reject creation if NIS already exists in tenant', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.createStudent('tenant-1', {
          nis: '10001',
          fullName: 'Ahmad Santri',
          gender: Gender.MALE,
          birthPlace: 'Jakarta',
          birthDate: '2010-05-15',
          admissionYear: 2026,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create student and assign class in transaction', async () => {
      mockPrisma.student.findFirst
        .mockResolvedValueOnce(null) // NIS uniqueness check
        .mockResolvedValueOnce({
          id: 'new-id',
          tenantId: 'tenant-1',
          nis: '10001',
          fullName: 'Ahmad Santri',
          gender: Gender.MALE,
          birthPlace: 'Jakarta',
          birthDate: new Date('2010-05-15'),
          status: StudentStatus.ACTIVE,
          admissionYear: 2026,
          classStudents: [{ classGroup: { id: 'c-1', name: '7A', gradeLevel: 7 } }],
          guardians: [],
          createdAt: new Date(),
          updatedAt: new Date(),
        });

      mockPrisma.student.create.mockResolvedValue({
        id: 'new-id',
        nis: '10001',
        fullName: 'Ahmad Santri',
      });

      const res = await service.createStudent('tenant-1', {
        nis: '10001',
        fullName: 'Ahmad Santri',
        gender: Gender.MALE,
        birthPlace: 'Jakarta',
        birthDate: '2010-05-15',
        admissionYear: 2026,
        classGroupId: 'c-1',
      });

      expect(res).toBeDefined();
      expect(res.nis).toBe('10001');
      expect(mockAudit.record).toHaveBeenCalled();
    });
  });

  describe('getStudentById', () => {
    it('should throw NotFoundException if student does not exist', async () => {
      mockPrisma.student.findFirst.mockResolvedValue(null);

      await expect(service.getStudentById('tenant-1', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('deleteStudent', () => {
    it('should perform soft delete', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 's-1', tenantId: 'tenant-1' });
      mockPrisma.student.update.mockResolvedValue({});

      const res = await service.deleteStudent('tenant-1', 's-1');
      expect(res.message).toContain('deleted');
      expect(mockPrisma.student.update).toHaveBeenCalledWith({
        where: { id: 's-1' },
        data: { deletedAt: expect.any(Date) },
      });
    });
  });
});
