import { Test, TestingModule } from '@nestjs/testing';
import { CbtService } from './cbt.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GradesService } from '../academics/grades.service';
import { QuestionType, ExamSessionStatus, GradeComponent } from '@edusaas/shared-types';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

describe('CbtService', () => {
  let service: CbtService;
  let prisma: any;
  let auditService: any;
  let gradesService: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '99999999-9999-9999-9999-999999999999';
  const mockSubjectId = '22222222-2222-2222-2222-222222222222';
  const mockClassGroupId = '33333333-3333-3333-3333-333333333333';
  const mockAcademicYearId = '44444444-4444-4444-4444-444444444444';
  const mockStudentId = '55555555-5555-5555-5555-555555555555';
  const mockExamId = '66666666-6666-6666-6666-666666666666';

  beforeEach(async () => {
    prisma = {
      subject: { findFirst: jest.fn() },
      classGroup: { findFirst: jest.fn() },
      academicYear: { findFirst: jest.fn() },
      employee: { findFirst: jest.fn() },
      student: { findFirst: jest.fn() },
      questionBank: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      examQuestion: {
        create: jest.fn(),
        count: jest.fn().mockResolvedValue(0),
        findFirst: jest.fn(),
        findMany: jest.fn(),
      },
      exam: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      studentExamSession: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      studentExamAnswer: {
        upsert: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    gradesService = {
      recordGrade: jest.fn().mockResolvedValue({ id: 'grade-synced-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CbtService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: GradesService, useValue: gradesService },
      ],
    }).compile();

    service = module.get<CbtService>(CbtService);
  });

  describe('createQuestionBank & createExamQuestion', () => {
    it('should create a question bank and add objective questions with answer key', async () => {
      prisma.subject.findFirst.mockResolvedValue({
        id: mockSubjectId,
        name: 'Fiqih Fathul Qorib',
        code: 'FQH-01',
        curriculumType: 'PESANTREN_DINIYAH',
      });
      prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1', fullName: 'Ustaz Ridwan' });

      const mockBank = {
        id: 'bank-1',
        tenantId: mockTenantId,
        subjectId: mockSubjectId,
        title: 'Bank Soal Fiqih Thaharah & Shalat',
        curriculumType: 'PESANTREN_DINIYAH',
        authorEmployeeId: 'emp-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: { name: 'Fiqih Fathul Qorib', code: 'FQH-01' },
        author: { fullName: 'Ustaz Ridwan' },
      };

      prisma.questionBank.create.mockResolvedValue(mockBank);

      const bankResult = await service.createQuestionBank(mockTenantId, mockUserId, {
        subjectId: mockSubjectId,
        title: 'Bank Soal Fiqih Thaharah & Shalat',
      });

      expect(bankResult.title).toBe('Bank Soal Fiqih Thaharah & Shalat');
      expect(bankResult.curriculumType).toBe('PESANTREN_DINIYAH');

      // Now add a question to this bank
      prisma.questionBank.findFirst.mockResolvedValue(mockBank);

      const mockQuestion = {
        id: 'q-1',
        tenantId: mockTenantId,
        bankId: 'bank-1',
        questionText: 'Air yang suci dan mensucikan serta tidak makruh digunakan adalah air...',
        questionType: QuestionType.MULTIPLE_CHOICE,
        scoreWeight: new Prisma.Decimal(2.0),
        options: [
          { id: 'A', text: 'Air Mutlak' },
          { id: 'B', text: 'Air Musta\'mal' },
          { id: 'C', text: 'Air Musyammas' },
          { id: 'D', text: 'Air Mutanajjis' },
        ],
        correctAnswer: 'A',
        explanation: 'Air mutlak adalah air murni yang turun dari langit atau keluar dari bumi.',
        orderIndex: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.examQuestion.create.mockResolvedValue(mockQuestion);

      const qResult = await service.createExamQuestion(mockTenantId, mockUserId, {
        bankId: 'bank-1',
        questionText: 'Air yang suci dan mensucikan serta tidak makruh digunakan adalah air...',
        questionType: QuestionType.MULTIPLE_CHOICE,
        scoreWeight: 2.0,
        options: [
          { id: 'A', text: 'Air Mutlak' },
          { id: 'B', text: 'Air Musta\'mal' },
          { id: 'C', text: 'Air Musyammas' },
          { id: 'D', text: 'Air Mutanajjis' },
        ],
        correctAnswer: 'A',
        explanation: 'Air mutlak adalah air murni yang turun dari langit atau keluar dari bumi.',
      });

      expect(qResult.correctAnswer).toBe('A');
      expect(qResult.scoreWeight).toBe(2.0);
    });
  });

  describe('createExam', () => {
    it('should create an exam package with security token, duration, and question mappings', async () => {
      prisma.subject.findFirst.mockResolvedValue({ id: mockSubjectId, name: 'Nahwu' });
      prisma.classGroup.findFirst.mockResolvedValue({ id: mockClassGroupId, name: '10 MIPA 1' });
      prisma.academicYear.findFirst.mockResolvedValue({ id: mockAcademicYearId, name: '2026/2027 Ganjil' });

      const mockExam = {
        id: mockExamId,
        tenantId: mockTenantId,
        title: 'Penilaian Akhir Semester CBT: Nahwu',
        subjectId: mockSubjectId,
        classGroupId: mockClassGroupId,
        academicYearId: mockAcademicYearId,
        token: 'NAHWU1',
        durationMinutes: 90,
        startTime: new Date('2026-11-20T08:00:00Z'),
        endTime: new Date('2026-11-20T12:00:00Z'),
        passingScore: new Prisma.Decimal(75),
        shuffleQuestions: true,
        shuffleOptions: true,
        isPublished: true,
        component: GradeComponent.FINAL_EXAM,
        createdAt: new Date(),
        updatedAt: new Date(),
        subject: { name: 'Nahwu', code: 'NHW' },
        classGroup: { name: '10 MIPA 1' },
        academicYear: { name: '2026/2027 Ganjil' },
      };

      prisma.exam.create.mockResolvedValue(mockExam);

      const result = await service.createExam(mockTenantId, mockUserId, {
        title: 'Penilaian Akhir Semester CBT: Nahwu',
        subjectId: mockSubjectId,
        classGroupId: mockClassGroupId,
        academicYearId: mockAcademicYearId,
        token: 'NAHWU1',
        durationMinutes: 90,
        startTime: '2026-11-20T08:00:00Z',
        endTime: '2026-11-20T12:00:00Z',
        passingScore: 75,
        questionIds: ['q-1', 'q-2'],
      });

      expect(result.token).toBe('NAHWU1');
      expect(result.durationMinutes).toBe(90);
      expect(result.totalQuestions).toBe(2);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'EXAM_CREATED' }),
      );
    });
  });

  describe('startExamSession', () => {
    it('should throw BadRequestException when invalid token is entered', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: mockStudentId,
        classStudents: [{ classGroupId: mockClassGroupId }],
      });
      prisma.exam.findFirst.mockResolvedValue({
        id: mockExamId,
        token: 'CORRECT',
        classGroupId: mockClassGroupId,
        startTime: new Date(Date.now() - 3600000),
        endTime: new Date(Date.now() + 3600000),
        questions: [],
      });

      await expect(
        service.startExamSession(mockTenantId, mockUserId, {
          examId: mockExamId,
          token: 'WRONGTOKEN',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should start exam session, calculate remaining time, and hide answer keys from student', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: mockStudentId,
        fullName: 'Ahmad Faiz',
        nis: '2026001',
        classStudents: [{ classGroupId: mockClassGroupId }],
      });

      const questionObj = {
        id: 'q-1',
        tenantId: mockTenantId,
        bankId: 'b-1',
        questionText: 'Soal 1',
        questionType: QuestionType.MULTIPLE_CHOICE,
        scoreWeight: new Prisma.Decimal(1.0),
        options: [{ id: 'A', text: 'Pilihan A' }, { id: 'B', text: 'Pilihan B' }],
        correctAnswer: 'A', // MUST BE HIDDEN IN RESPONSE!
        explanation: 'Kunci jawaban',
        orderIndex: 1,
        createdAt: new Date(),
      };

      prisma.exam.findFirst.mockResolvedValue({
        id: mockExamId,
        title: 'Ujian CBT',
        token: 'TOKEN1',
        classGroupId: mockClassGroupId,
        durationMinutes: 60,
        startTime: new Date(Date.now() - 60000), // started 1 min ago
        endTime: new Date(Date.now() + 3600000), // ends in 1 hour
        shuffleQuestions: false,
        shuffleOptions: false,
        questions: [{ question: questionObj }],
      });

      prisma.studentExamSession.findUnique.mockResolvedValue(null);

      const mockSession = {
        id: 'session-1',
        tenantId: mockTenantId,
        examId: mockExamId,
        studentId: mockStudentId,
        startedAt: new Date(),
        submittedAt: null,
        status: ExamSessionStatus.IN_PROGRESS,
        answers: [],
      };

      prisma.studentExamSession.create.mockResolvedValue(mockSession);

      const session = await service.startExamSession(mockTenantId, mockUserId, {
        examId: mockExamId,
        token: 'TOKEN1',
      });

      expect(session.status).toBe(ExamSessionStatus.IN_PROGRESS);
      expect(session.remainingSeconds).toBeGreaterThan(0);
      expect(session.questions).toHaveLength(1);
      // Verify security: correctAnswer MUST BE NULL for students
      expect(session.questions![0].correctAnswer).toBeNull();
      expect(session.questions![0].explanation).toBeNull();
    });
  });

  describe('submitAnswer & finishExamSession', () => {
    it('should evaluate multiple choice correctness and award score on submitAnswer', async () => {
      prisma.studentExamSession.findFirst.mockResolvedValue({
        id: 'session-1',
        status: ExamSessionStatus.IN_PROGRESS,
      });

      prisma.examQuestion.findFirst.mockResolvedValue({
        id: 'q-1',
        questionType: QuestionType.MULTIPLE_CHOICE,
        correctAnswer: 'C',
        scoreWeight: new Prisma.Decimal(5.0),
      });

      prisma.studentExamAnswer.upsert.mockResolvedValue({});

      // Test correct answer
      const resCorrect = await service.submitAnswer(mockTenantId, mockUserId, 'session-1', {
        questionId: 'q-1',
        selectedOption: 'C',
      });
      expect(resCorrect.isCorrect).toBe(true);

      // Test incorrect answer
      const resWrong = await service.submitAnswer(mockTenantId, mockUserId, 'session-1', {
        questionId: 'q-1',
        selectedOption: 'A',
      });
      expect(resWrong.isCorrect).toBe(false);
    });

    it('should finish exam session, calculate score percentage, pass/fail status, and auto-sync to Grade Engine', async () => {
      const q1 = { id: 'q-1', scoreWeight: new Prisma.Decimal(50) };
      const q2 = { id: 'q-2', scoreWeight: new Prisma.Decimal(50) };

      prisma.studentExamSession.findFirst.mockResolvedValue({
        id: 'session-1',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        examId: mockExamId,
        startedAt: new Date(Date.now() - 3600000),
        exam: {
          id: mockExamId,
          title: 'UAS CBT Matematika',
          subjectId: mockSubjectId,
          academicYearId: mockAcademicYearId,
          passingScore: new Prisma.Decimal(75),
          component: GradeComponent.FINAL_EXAM,
          classGroup: { name: '10 MIPA 1' },
          questions: [{ question: q1 }, { question: q2 }],
        },
        student: { id: mockStudentId, fullName: 'Ahmad Dahlan', nis: '2026001' },
        // Q1 is correct (50), Q2 is correct (50) -> Total 100/100 -> 100% -> Passed!
        answers: [
          { questionId: 'q-1', isCorrect: true, awardedScore: new Prisma.Decimal(50) },
          { questionId: 'q-2', isCorrect: true, awardedScore: new Prisma.Decimal(50) },
        ],
      });

      prisma.studentExamSession.update.mockResolvedValue({
        id: 'session-1',
        submittedAt: new Date(),
      });

      const result = await service.finishExamSession(mockTenantId, mockUserId, 'session-1');

      expect(result.score).toBe(100);
      expect(result.percentage).toBe(100);
      expect(result.isPassed).toBe(true);
      expect(result.correctAnswersCount).toBe(2);
      expect(result.syncedToGrades).toBe(true);

      // Verify that Grade Engine (Phase 5) was called to automatically sync the CBT score!
      expect(gradesService.recordGrade).toHaveBeenCalledWith(
        mockTenantId,
        mockUserId,
        expect.objectContaining({
          studentId: mockStudentId,
          subjectId: mockSubjectId,
          score: 100,
          component: GradeComponent.FINAL_EXAM,
        }),
      );
    });
  });
});
