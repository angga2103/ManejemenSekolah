import { Test, TestingModule } from '@nestjs/testing';
import { ClassesService } from './classes.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('ClassesService', () => {
  let service: ClassesService;

  const mockPrisma = {
    classGroup: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    student: {
      findFirst: jest.fn(),
    },
    classStudent: {
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
  };

  const mockAudit = {
    record: jest.fn().mockResolvedValue(null),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClassesService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<ClassesService>(ClassesService);
    jest.clearAllMocks();
  });

  describe('createClass', () => {
    it('should reject creation if class name already exists for academic year', async () => {
      mockPrisma.classGroup.findFirst.mockResolvedValue({ id: 'existing-id' });

      await expect(
        service.createClass('tenant-1', {
          institutionId: 'inst-1',
          academicYearId: 'ay-1',
          name: '10 MIPA 1',
          gradeLevel: 10,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create class successfully', async () => {
      mockPrisma.classGroup.findFirst.mockResolvedValue(null);
      mockPrisma.classGroup.create.mockResolvedValue({
        id: 'new-class-id',
        tenantId: 'tenant-1',
        institutionId: 'inst-1',
        academicYearId: 'ay-1',
        name: '10 MIPA 1',
        gradeLevel: 10,
        homeroomTeacherId: null,
        homeroomTeacher: null,
        createdAt: new Date(),
      });

      const res = await service.createClass('tenant-1', {
        institutionId: 'inst-1',
        academicYearId: 'ay-1',
        name: '10 MIPA 1',
        gradeLevel: 10,
      });

      expect(res).toBeDefined();
      expect(res.name).toBe('10 MIPA 1');
      expect(mockAudit.record).toHaveBeenCalled();
    });
  });

  describe('assignStudent', () => {
    it('should assign student to class', async () => {
      mockPrisma.student.findFirst.mockResolvedValue({ id: 's-1' });
      mockPrisma.classGroup.findFirst.mockResolvedValue({ id: 'c-1' });
      mockPrisma.classStudent.upsert.mockResolvedValue({});

      const res = await service.assignStudent('tenant-1', {
        studentId: 's-1',
        classGroupId: 'c-1',
      });

      expect(res.message).toContain('assigned');
      expect(mockAudit.record).toHaveBeenCalled();
    });
  });
});
