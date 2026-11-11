import { Test, TestingModule } from '@nestjs/testing';
import { LmsService } from './lms.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { MaterialType, AssignmentStatus } from '@edusaas/shared-types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('LmsService', () => {
  let service: LmsService;
  let prisma: any;
  let auditService: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '99999999-9999-9999-9999-999999999999';
  const mockSubjectId = '22222222-2222-2222-2222-222222222222';
  const mockClassGroupId = '33333333-3333-3333-3333-333333333333';
  const mockStudentId = '44444444-4444-4444-4444-444444444444';
  const mockAssignmentId = '55555555-5555-5555-5555-555555555555';

  beforeEach(async () => {
    prisma = {
      subject: { findFirst: jest.fn() },
      classGroup: { findFirst: jest.fn() },
      employee: { findFirst: jest.fn() },
      student: { findFirst: jest.fn() },
      courseMaterial: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      assignment: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      assignmentSubmission: {
        upsert: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LmsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<LmsService>(LmsService);
  });

  describe('createMaterial', () => {
    it('should create a digital course material and record audit log', async () => {
      prisma.subject.findFirst.mockResolvedValue({ id: mockSubjectId, name: 'Nahwu Jurumiyyah' });
      prisma.classGroup.findFirst.mockResolvedValue({ id: mockClassGroupId, name: '10 Diniyah Ula' });
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', fullName: 'Ustaz Ahmad' });

      const mockMaterial = {
        id: 'mat-1',
        tenantId: mockTenantId,
        subjectId: mockSubjectId,
        classGroupId: mockClassGroupId,
        authorEmployeeId: 'emp-1',
        title: 'Pengantar Ilmu Nahwu & Matan Kalam',
        description: 'Materi dasar memahami tanda-tanda isim dan fiil',
        materialType: MaterialType.DOCUMENT,
        fileUrl: 'https://s3.edusaas.test/nahwu-bab-1.pdf',
        content: null,
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: { name: 'Nahwu Jurumiyyah', code: 'NHW-01', curriculumType: 'PESANTREN_DINIYAH' },
        classGroup: { name: '10 Diniyah Ula' },
        author: { fullName: 'Ustaz Ahmad' },
      };

      prisma.courseMaterial.create.mockResolvedValue(mockMaterial);

      const result = await service.createMaterial(mockTenantId, mockUserId, {
        subjectId: mockSubjectId,
        classGroupId: mockClassGroupId,
        title: 'Pengantar Ilmu Nahwu & Matan Kalam',
        description: 'Materi dasar memahami tanda-tanda isim dan fiil',
        materialType: MaterialType.DOCUMENT,
        fileUrl: 'https://s3.edusaas.test/nahwu-bab-1.pdf',
      });

      expect(result.title).toBe('Pengantar Ilmu Nahwu & Matan Kalam');
      expect(result.materialType).toBe(MaterialType.DOCUMENT);
      expect(result.authorName).toBe('Ustaz Ahmad');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'COURSE_MATERIAL_CREATED' }),
      );
    });

    it('should throw NotFoundException if subject does not belong to tenant', async () => {
      prisma.subject.findFirst.mockResolvedValue(null);

      await expect(
        service.createMaterial(mockTenantId, mockUserId, {
          subjectId: 'invalid-subject',
          title: 'Materi Test',
          materialType: MaterialType.DOCUMENT,
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('createAssignment & submitAssignment', () => {
    it('should create an assignment with due date and max score', async () => {
      prisma.subject.findFirst.mockResolvedValue({ id: mockSubjectId, name: 'Fiqih Fathul Qorib' });
      prisma.classGroup.findFirst.mockResolvedValue({ id: mockClassGroupId, name: '10 Diniyah Ula' });
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', fullName: 'Ustaz Zaid' });

      const mockAssignment = {
        id: mockAssignmentId,
        tenantId: mockTenantId,
        subjectId: mockSubjectId,
        classGroupId: mockClassGroupId,
        teacherEmployeeId: 'emp-1',
        title: 'Ringkasan Bab Shalat Berjamaah',
        instructions: 'Tuliskan syarat-syarat sah makmum masbuq minimal 1 halaman.',
        attachmentUrl: null,
        dueDate: new Date(Date.now() + 86400000), // tomorrow
        maxScore: new Prisma.Decimal(100),
        isPublished: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: { name: 'Fiqih Fathul Qorib', code: 'FQH-01' },
        classGroup: { name: '10 Diniyah Ula' },
        teacher: { fullName: 'Ustaz Zaid' },
        submissions: [],
      };

      prisma.assignment.create.mockResolvedValue(mockAssignment);

      const result = await service.createAssignment(mockTenantId, mockUserId, {
        subjectId: mockSubjectId,
        classGroupId: mockClassGroupId,
        title: 'Ringkasan Bab Shalat Berjamaah',
        instructions: 'Tuliskan syarat-syarat sah makmum masbuq minimal 1 halaman.',
        dueDate: new Date(Date.now() + 86400000).toISOString(),
        maxScore: 100,
      });

      expect(result.title).toBe('Ringkasan Bab Shalat Berjamaah');
      expect(result.maxScore).toBe(100);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ASSIGNMENT_CREATED' }),
      );
    });

    it('should mark submission as SUBMITTED when delivered before due date', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: mockStudentId });
      prisma.assignment.findFirst.mockResolvedValue({
        id: mockAssignmentId,
        dueDate: new Date(Date.now() + 86400000), // future
      });

      const mockSubmission = {
        id: 'sub-1',
        tenantId: mockTenantId,
        assignmentId: mockAssignmentId,
        studentId: mockStudentId,
        submittedAt: new Date(),
        fileUrl: 'https://s3.edusaas.test/tugas-fiqih-zaid.pdf',
        content: 'Berikut ringkasan syarat makmum masbuq...',
        score: null,
        feedback: null,
        gradedByEmployeeId: null,
        gradedAt: null,
        status: AssignmentStatus.SUBMITTED,
        assignment: { title: 'Tugas Fiqih' },
        student: { fullName: 'Santri Zaid', nis: '2026003' },
        gradedBy: null,
      };

      prisma.assignmentSubmission.upsert.mockResolvedValue(mockSubmission);

      const result = await service.submitAssignment(mockTenantId, mockUserId, mockAssignmentId, {
        fileUrl: 'https://s3.edusaas.test/tugas-fiqih-zaid.pdf',
        content: 'Berikut ringkasan syarat makmum masbuq...',
      });

      expect(result.status).toBe(AssignmentStatus.SUBMITTED);
      expect(result.studentName).toBe('Santri Zaid');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ASSIGNMENT_SUBMITTED' }),
      );
    });

    it('should mark submission as LATE when submitted after due date', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: mockStudentId });
      prisma.assignment.findFirst.mockResolvedValue({
        id: mockAssignmentId,
        dueDate: new Date(Date.now() - 86400000), // past
      });

      const mockSubmission = {
        id: 'sub-2',
        tenantId: mockTenantId,
        assignmentId: mockAssignmentId,
        studentId: mockStudentId,
        submittedAt: new Date(),
        fileUrl: null,
        content: 'Tugas terlambat dikumpulkan...',
        score: null,
        feedback: null,
        gradedByEmployeeId: null,
        gradedAt: null,
        status: AssignmentStatus.LATE,
        assignment: { title: 'Tugas Fiqih' },
        student: { fullName: 'Santri Zaid', nis: '2026003' },
        gradedBy: null,
      };

      prisma.assignmentSubmission.upsert.mockResolvedValue(mockSubmission);

      const result = await service.submitAssignment(mockTenantId, mockUserId, mockAssignmentId, {
        content: 'Tugas terlambat dikumpulkan...',
      });

      expect(result.status).toBe(AssignmentStatus.LATE);
    });
  });

  describe('gradeSubmission', () => {
    it('should update submission with score, feedback, and GRADED status', async () => {
      prisma.assignmentSubmission.findFirst.mockResolvedValue({ id: 'sub-1' });
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', fullName: 'Ustaz Ahmad' });

      const mockGraded = {
        id: 'sub-1',
        tenantId: mockTenantId,
        assignmentId: mockAssignmentId,
        studentId: mockStudentId,
        submittedAt: new Date(),
        fileUrl: null,
        content: 'Ringkasan tugas',
        score: new Prisma.Decimal(92),
        feedback: 'Mumtaz, penjelasan sangat rapi dan lengkap.',
        gradedByEmployeeId: 'emp-1',
        gradedAt: new Date(),
        status: AssignmentStatus.GRADED,
        assignment: { title: 'Tugas Nahwu' },
        student: { fullName: 'Santri Ahmad', nis: '2026001' },
        gradedBy: { fullName: 'Ustaz Ahmad' },
      };

      prisma.assignmentSubmission.update.mockResolvedValue(mockGraded);

      const result = await service.gradeSubmission(mockTenantId, mockUserId, 'sub-1', {
        score: 92,
        feedback: 'Mumtaz, penjelasan sangat rapi dan lengkap.',
      });

      expect(result.score).toBe(92);
      expect(result.status).toBe(AssignmentStatus.GRADED);
      expect(result.feedback).toContain('Mumtaz');
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'ASSIGNMENT_GRADED' }),
      );
    });

    it('should reject score out of 0-100 bounds', async () => {
      await expect(
        service.gradeSubmission(mockTenantId, mockUserId, 'sub-1', { score: 105 }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
