import { Test, TestingModule } from '@nestjs/testing';
import { GradesService } from './grades.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GradeComponent, CurriculumType } from '@edusaas/shared-types';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('GradesService', () => {
  let service: GradesService;
  let prisma: any;
  let auditService: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '99999999-9999-9999-9999-999999999999';
  const mockStudentId = '22222222-2222-2222-2222-222222222222';
  const mockSubjectId = '33333333-3333-3333-3333-333333333333';
  const mockAcademicYearId = '44444444-4444-4444-4444-444444444444';
  const mockClassGroupId = '55555555-5555-5555-5555-555555555555';

  beforeEach(async () => {
    prisma = {
      student: {
        findFirst: jest.fn(),
      },
      subject: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      academicYear: {
        findFirst: jest.fn(),
      },
      classGroup: {
        findFirst: jest.fn(),
      },
      grade: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GradesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
      ],
    }).compile();

    service = module.get<GradesService>(GradesService);
  });

  describe('recordGrade', () => {
    it('should throw BadRequestException if score is out of range', async () => {
      await expect(
        service.recordGrade(mockTenantId, mockUserId, {
          studentId: mockStudentId,
          subjectId: mockSubjectId,
          academicYearId: mockAcademicYearId,
          component: GradeComponent.FINAL_EXAM,
          score: 105,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if student is not found in tenant', async () => {
      prisma.student.findFirst.mockResolvedValue(null);

      await expect(
        service.recordGrade(mockTenantId, mockUserId, {
          studentId: mockStudentId,
          subjectId: mockSubjectId,
          academicYearId: mockAcademicYearId,
          component: GradeComponent.FINAL_EXAM,
          score: 85,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create new grade if none exists and log audit', async () => {
      prisma.student.findFirst.mockResolvedValue({ id: mockStudentId, fullName: 'Santri Ahmad' });
      prisma.subject.findFirst.mockResolvedValue({ id: mockSubjectId, name: 'Nahwu Jurumiyyah' });
      prisma.academicYear.findFirst.mockResolvedValue({ id: mockAcademicYearId, name: '2026/2027 Ganjil' });
      prisma.grade.findFirst.mockResolvedValue(null);

      const createdGrade = {
        id: 'grade-1',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        subjectId: mockSubjectId,
        academicYearId: mockAcademicYearId,
        component: GradeComponent.FINAL_EXAM,
        score: new Prisma.Decimal(92),
        weight: new Prisma.Decimal(1.0),
        notes: 'Ujian Akhir Semester',
        createdAt: new Date(),
        updatedAt: new Date(),
        student: { fullName: 'Santri Ahmad', nis: '2026001' },
        subject: { name: 'Nahwu Jurumiyyah', code: 'NHW-01', curriculumType: 'PESANTREN_DINIYAH' },
        academicYear: { name: '2026/2027 Ganjil' },
      };

      prisma.grade.create.mockResolvedValue(createdGrade);

      const result = await service.recordGrade(mockTenantId, mockUserId, {
        studentId: mockStudentId,
        subjectId: mockSubjectId,
        academicYearId: mockAcademicYearId,
        component: GradeComponent.FINAL_EXAM,
        score: 92,
        notes: 'Ujian Akhir Semester',
      });

      expect(result.score).toBe(92);
      expect(result.studentName).toBe('Santri Ahmad');
      expect(prisma.grade.create).toHaveBeenCalled();
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'GRADE_RECORDED' }),
      );
    });
  });

  describe('calculatePredicate', () => {
    it('should accurately categorize score ranges into A, B, C, D', () => {
      expect(service.calculatePredicate(95)).toBe('A');
      expect(service.calculatePredicate(90)).toBe('A');
      expect(service.calculatePredicate(89)).toBe('B');
      expect(service.calculatePredicate(80)).toBe('B');
      expect(service.calculatePredicate(79)).toBe('C');
      expect(service.calculatePredicate(70)).toBe('C');
      expect(service.calculatePredicate(69.9)).toBe('D');
      expect(service.calculatePredicate(50)).toBe('D');
    });
  });

  describe('calculateStudentSubjectScores (Dual Curricula)', () => {
    it('should compute weighted scores and competency narratives for both Formal and Pesantren curricula', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: mockStudentId,
        classStudents: [{ classGroup: { institutionId: 'inst-1' } }],
      });

      // 2 subjects: 1 Formal National (Matematika) and 1 Pesantren Diniyah (Fathul Qorib)
      prisma.subject.findMany.mockResolvedValue([
        {
          id: 'sub-formal',
          name: 'Matematika',
          code: 'MTK-10',
          curriculumType: CurriculumType.FORMAL_NATIONAL,
        },
        {
          id: 'sub-pesantren',
          name: 'Fiqih Fathul Qorib',
          code: 'FQH-01',
          curriculumType: CurriculumType.PESANTREN_DINIYAH,
        },
      ]);

      // Grades for Matematika: Daily (80), Quiz (80), Mid (90), Final (90)
      // Formal weights: Daily(20%), Quiz(15%), Mid(25%), Final(40%)
      // Weighted: 80*0.2 + 80*0.15 + 90*0.25 + 90*0.4 = 16 + 12 + 22.5 + 36 = 86.5 -> B
      //
      // Grades for Fathul Qorib: Daily(95), Practical/Sorogan(95), Quiz(90), Mid(95), Final(95)
      // Pesantren weights: Daily(20%), Practical(20%), Quiz(15%), Mid(20%), Final(25%)
      // Weighted: 95*0.2 + 95*0.2 + 90*0.15 + 95*0.2 + 95*0.25 = 19 + 19 + 13.5 + 19 + 23.75 = 94.25 -> A (Mumtaz)
      prisma.grade.findMany.mockResolvedValue([
        { subjectId: 'sub-formal', component: GradeComponent.DAILY_TASK, score: new Prisma.Decimal(80) },
        { subjectId: 'sub-formal', component: GradeComponent.QUIZ, score: new Prisma.Decimal(80) },
        { subjectId: 'sub-formal', component: GradeComponent.MID_EXAM, score: new Prisma.Decimal(90) },
        { subjectId: 'sub-formal', component: GradeComponent.FINAL_EXAM, score: new Prisma.Decimal(90) },

        { subjectId: 'sub-pesantren', component: GradeComponent.DAILY_TASK, score: new Prisma.Decimal(95) },
        { subjectId: 'sub-pesantren', component: GradeComponent.PRACTICAL, score: new Prisma.Decimal(95) },
        { subjectId: 'sub-pesantren', component: GradeComponent.QUIZ, score: new Prisma.Decimal(90) },
        { subjectId: 'sub-pesantren', component: GradeComponent.MID_EXAM, score: new Prisma.Decimal(95) },
        { subjectId: 'sub-pesantren', component: GradeComponent.FINAL_EXAM, score: new Prisma.Decimal(95) },
      ]);

      const summaries = await service.calculateStudentSubjectScores(
        mockTenantId,
        mockStudentId,
        mockAcademicYearId,
        75, // KKM
      );

      expect(summaries).toHaveLength(2);

      const formal = summaries.find((s) => s.subjectId === 'sub-formal')!;
      expect(formal.finalScore).toBe(86.5);
      expect(formal.predicate).toBe('B');
      expect(formal.isPassed).toBe(true);
      expect(formal.competencyDescription).toContain('Baik');

      const pesantren = summaries.find((s) => s.subjectId === 'sub-pesantren')!;
      expect(pesantren.finalScore).toBe(94.25);
      expect(pesantren.predicate).toBe('A');
      expect(pesantren.isPassed).toBe(true);
      expect(pesantren.competencyDescription).toContain('Mumtaz');
    });
  });

  describe('batchInputGrades', () => {
    it('should save grades for an entire class roster atomically in a transaction', async () => {
      prisma.classGroup.findFirst.mockResolvedValue({ id: mockClassGroupId });
      prisma.subject.findFirst.mockResolvedValue({ id: mockSubjectId });
      prisma.academicYear.findFirst.mockResolvedValue({ id: mockAcademicYearId });
      prisma.grade.findFirst.mockResolvedValue(null);

      const mockSavedGrade = {
        id: 'grade-1',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        subjectId: mockSubjectId,
        academicYearId: mockAcademicYearId,
        component: GradeComponent.FINAL_EXAM,
        score: new Prisma.Decimal(88),
        weight: new Prisma.Decimal(1.0),
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        student: { fullName: 'Santri 1', nis: '001' },
        subject: { name: 'Nahwu', code: 'NHW' },
        academicYear: { name: '2026/2027 Ganjil' },
      };

      prisma.grade.create.mockResolvedValue(mockSavedGrade);

      const result = await service.batchInputGrades(mockTenantId, mockUserId, {
        classGroupId: mockClassGroupId,
        subjectId: mockSubjectId,
        academicYearId: mockAcademicYearId,
        component: GradeComponent.FINAL_EXAM,
        items: [
          { studentId: mockStudentId, score: 88 },
          { studentId: 'student-2', score: 92 },
        ],
      });

      expect(result.count).toBe(2);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'BATCH_GRADES_RECORDED' }),
      );
    });
  });
});
