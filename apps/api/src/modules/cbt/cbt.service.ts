import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GradesService } from '../academics/grades.service';
import {
  QuestionType,
  ExamSessionStatus,
  GradeComponent,
} from '@edusaas/shared-types';
import {
  CreateQuestionBankDto,
  CreateExamQuestionDto,
  QuestionBankResponseData,
  ExamQuestionResponseData,
  CreateExamDto,
  ExamFilterDto,
  ExamResponseData,
  StartExamSessionDto,
  SubmitExamAnswerDto,
  ExamSessionResponseData,
  ExamResultDetailResponseData,
} from '@edusaas/api-contracts';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class CbtService {
  private readonly logger = new Logger(CbtService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly gradesService: GradesService,
  ) {}

  // ===========================================================================
  // 1. QUESTION BANK & QUESTIONS (BANK SOAL & BUTIR SOAL)
  // ===========================================================================

  async createQuestionBank(
    tenantId: string,
    userId: string,
    dto: CreateQuestionBankDto,
  ): Promise<QuestionBankResponseData> {
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, tenantId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${dto.subjectId} not found`);
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId, tenantId },
    });

    const bank = await this.prisma.questionBank.create({
      data: {
        tenantId,
        subjectId: dto.subjectId,
        title: dto.title,
        curriculumType: dto.curriculumType || subject.curriculumType,
        authorEmployeeId: employee?.id || null,
      },
      include: {
        subject: true,
        author: true,
      },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'QUESTION_BANK_CREATED',
      resource: 'question_banks',
      resourceId: bank.id,
      newValues: { title: dto.title, subjectId: dto.subjectId },
    });

    return {
      id: bank.id,
      tenantId: bank.tenantId,
      subjectId: bank.subjectId,
      subjectName: bank.subject.name,
      subjectCode: bank.subject.code,
      curriculumType: bank.curriculumType,
      title: bank.title,
      authorEmployeeId: bank.authorEmployeeId,
      authorName: bank.author?.fullName,
      totalQuestions: 0,
      createdAt: bank.createdAt.toISOString(),
      updatedAt: bank.updatedAt.toISOString(),
    };
  }

  async createExamQuestion(
    tenantId: string,
    userId: string,
    dto: CreateExamQuestionDto,
  ): Promise<ExamQuestionResponseData> {
    const bank = await this.prisma.questionBank.findFirst({
      where: { id: dto.bankId, tenantId },
    });
    if (!bank) {
      throw new NotFoundException(`Question bank with ID ${dto.bankId} not found`);
    }

    const count = await this.prisma.examQuestion.count({
      where: { bankId: dto.bankId },
    });

    const weight = dto.scoreWeight !== undefined && dto.scoreWeight > 0 ? dto.scoreWeight : 1.0;

    const question = await this.prisma.examQuestion.create({
      data: {
        tenantId,
        bankId: dto.bankId,
        questionText: dto.questionText,
        questionType: (dto.questionType as QuestionType) || QuestionType.MULTIPLE_CHOICE,
        scoreWeight: new Prisma.Decimal(weight),
        options: dto.options ? (dto.options as unknown as Prisma.InputJsonValue) : Prisma.JsonNull,
        correctAnswer: dto.correctAnswer,
        explanation: dto.explanation || null,
        orderIndex: dto.orderIndex !== undefined ? dto.orderIndex : count + 1,
      },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'EXAM_QUESTION_CREATED',
      resource: 'exam_questions',
      resourceId: question.id,
      newValues: { bankId: dto.bankId, type: dto.questionType },
    });

    return this.mapQuestionToResponse(question, true);
  }

  async findQuestionBanks(
    tenantId: string,
    subjectId?: string,
  ): Promise<QuestionBankResponseData[]> {
    const banks = await this.prisma.questionBank.findMany({
      where: {
        tenantId,
        ...(subjectId && { subjectId }),
      },
      include: {
        subject: true,
        author: true,
        questions: { select: { id: true } },
      },
      orderBy: [{ createdAt: 'desc' }],
    });

    return banks.map((b) => ({
      id: b.id,
      tenantId: b.tenantId,
      subjectId: b.subjectId,
      subjectName: b.subject.name,
      subjectCode: b.subject.code,
      curriculumType: b.curriculumType,
      title: b.title,
      authorEmployeeId: b.authorEmployeeId,
      authorName: b.author?.fullName,
      totalQuestions: b.questions.length,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString(),
    }));
  }

  async findQuestionsByBank(
    tenantId: string,
    bankId: string,
    showAnswer = true,
  ): Promise<ExamQuestionResponseData[]> {
    const questions = await this.prisma.examQuestion.findMany({
      where: { bankId, tenantId },
      orderBy: [{ orderIndex: 'asc' }],
    });

    return questions.map((q) => this.mapQuestionToResponse(q, showAnswer));
  }

  // ===========================================================================
  // 2. CBT EXAMS (PAKET & JADWAL UJIAN CBT)
  // ===========================================================================

  async createExam(
    tenantId: string,
    userId: string,
    dto: CreateExamDto,
  ): Promise<ExamResponseData> {
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, tenantId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${dto.subjectId} not found`);
    }

    const classGroup = await this.prisma.classGroup.findFirst({
      where: { id: dto.classGroupId, tenantId },
    });
    if (!classGroup) {
      throw new NotFoundException(`ClassGroup with ID ${dto.classGroupId} not found`);
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, tenantId },
    });
    if (!academicYear) {
      throw new NotFoundException(`AcademicYear with ID ${dto.academicYearId} not found`);
    }

    if (!dto.questionIds || dto.questionIds.length === 0) {
      throw new BadRequestException('Exam must contain at least one question');
    }

    const token = dto.token?.trim().toUpperCase() || this.generateExamToken();
    const passingScore = dto.passingScore !== undefined ? dto.passingScore : 75.0;

    const exam = await this.prisma.exam.create({
      data: {
        tenantId,
        title: dto.title,
        subjectId: dto.subjectId,
        classGroupId: dto.classGroupId,
        academicYearId: dto.academicYearId,
        token,
        durationMinutes: dto.durationMinutes,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        passingScore: new Prisma.Decimal(passingScore),
        shuffleQuestions: dto.shuffleQuestions !== undefined ? dto.shuffleQuestions : true,
        shuffleOptions: dto.shuffleOptions !== undefined ? dto.shuffleOptions : true,
        isPublished: dto.isPublished !== undefined ? dto.isPublished : false,
        component: (dto.component as GradeComponent) || GradeComponent.FINAL_EXAM,
        questions: {
          create: dto.questionIds.map((qId, idx) => ({
            questionId: qId,
            orderIndex: idx + 1,
          })),
        },
      },
      include: {
        subject: true,
        classGroup: true,
        academicYear: true,
        questions: true,
      },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'EXAM_CREATED',
      resource: 'exams',
      resourceId: exam.id,
      newValues: { title: dto.title, token, totalQuestions: dto.questionIds.length },
    });

    return this.mapExamToResponse(exam, dto.questionIds.length, 0);
  }

  async findExams(
    tenantId: string,
    filter: ExamFilterDto,
    studentUserId?: string,
  ): Promise<{ data: ExamResponseData[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    let allowedClassGroupIds: string[] | undefined = undefined;

    if (studentUserId) {
      const student = await this.prisma.student.findFirst({
        where: { userId: studentUserId, tenantId },
        include: { classStudents: true },
      });
      if (!student) {
        return { data: [], total: 0, page, limit };
      }
      allowedClassGroupIds = student.classStudents.map((cs) => cs.classGroupId);
    }

    const where: Prisma.ExamWhereInput = {
      tenantId,
      ...(filter.subjectId && { subjectId: filter.subjectId }),
      ...(filter.classGroupId && { classGroupId: filter.classGroupId }),
      ...(filter.academicYearId && { academicYearId: filter.academicYearId }),
      ...(filter.isPublished !== undefined && { isPublished: filter.isPublished }),
      ...(allowedClassGroupIds && { classGroupId: { in: allowedClassGroupIds }, isPublished: true }),
    };

    const [exams, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        include: {
          subject: true,
          classGroup: true,
          academicYear: true,
          questions: true,
          sessions: { select: { id: true } },
        },
        orderBy: [{ startTime: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.exam.count({ where }),
    ]);

    const data = exams.map((e) =>
      this.mapExamToResponse(e, e.questions.length, e.sessions.length),
    );

    return { data, total, page, limit };
  }

  // ===========================================================================
  // 3. CBT EXAM SESSION ENGINE (SESI UJIAN & AUTOSAVE SANTRI)
  // ===========================================================================

  async startExamSession(
    tenantId: string,
    studentUserId: string,
    dto: StartExamSessionDto,
  ): Promise<ExamSessionResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { userId: studentUserId, tenantId },
      include: { classStudents: true },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const exam = await this.prisma.exam.findFirst({
      where: { id: dto.examId, tenantId },
      include: {
        questions: {
          include: { question: true },
          orderBy: [{ orderIndex: 'asc' }],
        },
      },
    });

    if (!exam) {
      throw new NotFoundException(`Exam with ID ${dto.examId} not found`);
    }

    // Verify token
    if (exam.token.toUpperCase() !== dto.token.trim().toUpperCase()) {
      throw new BadRequestException('Token ujian tidak valid. Silakan hubungi proktor/pengawas.');
    }

    // Verify class enrollment
    const isEnrolled = student.classStudents.some((cs) => cs.classGroupId === exam.classGroupId);
    if (!isEnrolled) {
      throw new ForbiddenException('Anda tidak terdaftar dalam rombel ujian ini');
    }

    // Verify time window
    const now = new Date();
    if (now < exam.startTime) {
      throw new BadRequestException('Ujian belum dimulai sesuai jadwal');
    }
    if (now > exam.endTime) {
      throw new BadRequestException('Waktu pelaksanaan ujian telah berakhir');
    }

    // Check existing session
    let session = await this.prisma.studentExamSession.findUnique({
      where: {
        tenantId_examId_studentId: {
          tenantId,
          examId: exam.id,
          studentId: student.id,
        },
      },
      include: {
        answers: true,
      },
    });

    if (session && session.status === ExamSessionStatus.SUBMITTED) {
      throw new BadRequestException('Anda sudah menyelesaikan ujian ini');
    }

    if (!session) {
      session = await this.prisma.studentExamSession.create({
        data: {
          tenantId,
          examId: exam.id,
          studentId: student.id,
          startedAt: now,
          status: ExamSessionStatus.IN_PROGRESS,
        },
        include: {
          answers: true,
        },
      });

      await this.auditService.record({
        tenantId,
        userId: studentUserId,
        action: 'EXAM_SESSION_STARTED',
        resource: 'student_exam_sessions',
        resourceId: session.id,
        newValues: { examId: exam.id },
      });
    }

    // Calculate remaining time
    const durationSeconds = exam.durationMinutes * 60;
    const elapsedSeconds = Math.floor((now.getTime() - session.startedAt.getTime()) / 1000);
    const remainingSeconds = Math.max(0, durationSeconds - elapsedSeconds);

    // Prepare questions (without correct answers)
    let questions = exam.questions.map((m) => this.mapQuestionToResponse(m.question, false));

    if (exam.shuffleQuestions) {
      // Deterministic shuffle based on studentId and examId
      questions = this.shuffleArray(questions);
    }

    return {
      id: session.id,
      tenantId: session.tenantId,
      examId: exam.id,
      examTitle: exam.title,
      durationMinutes: exam.durationMinutes,
      studentId: student.id,
      studentName: student.fullName,
      studentNis: student.nis,
      startedAt: session.startedAt.toISOString(),
      submittedAt: session.submittedAt?.toISOString() || null,
      status: session.status as unknown as ExamSessionStatus,
      remainingSeconds,
      totalQuestions: questions.length,
      answeredQuestions: session.answers.length,
      questions,
    };
  }

  async submitAnswer(
    tenantId: string,
    studentUserId: string,
    sessionId: string,
    dto: SubmitExamAnswerDto,
  ): Promise<{ success: boolean; isCorrect: boolean | null }> {
    const session = await this.prisma.studentExamSession.findFirst({
      where: { id: sessionId, tenantId },
      include: {
        exam: true,
        student: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Exam session ${sessionId} not found`);
    }

    if (session.status !== ExamSessionStatus.IN_PROGRESS) {
      throw new BadRequestException('Sesi ujian sudah ditutup atau diselesaikan');
    }

    const question = await this.prisma.examQuestion.findFirst({
      where: { id: dto.questionId, tenantId },
    });
    if (!question) {
      throw new NotFoundException(`Question ${dto.questionId} not found`);
    }

    // Objective scoring check for multiple choice / true-false
    let isCorrect: boolean | null = null;
    let awardedScore: Prisma.Decimal = new Prisma.Decimal(0);

    if (question.questionType === QuestionType.MULTIPLE_CHOICE || question.questionType === QuestionType.TRUE_FALSE) {
      if (dto.selectedOption) {
        isCorrect = dto.selectedOption.trim().toUpperCase() === question.correctAnswer.trim().toUpperCase();
        awardedScore = isCorrect ? question.scoreWeight : new Prisma.Decimal(0);
      }
    }

    await this.prisma.studentExamAnswer.upsert({
      where: {
        sessionId_questionId: {
          sessionId,
          questionId: dto.questionId,
        },
      },
      update: {
        selectedOption: dto.selectedOption || null,
        essayAnswer: dto.essayAnswer || null,
        isCorrect,
        awardedScore,
      },
      create: {
        sessionId,
        questionId: dto.questionId,
        selectedOption: dto.selectedOption || null,
        essayAnswer: dto.essayAnswer || null,
        isCorrect,
        awardedScore,
      },
    });

    return {
      success: true,
      isCorrect,
    };
  }

  async finishExamSession(
    tenantId: string,
    studentUserId: string,
    sessionId: string,
  ): Promise<ExamResultDetailResponseData> {
    const session = await this.prisma.studentExamSession.findFirst({
      where: { id: sessionId, tenantId },
      include: {
        exam: {
          include: {
            classGroup: true,
            questions: {
              include: { question: true },
            },
          },
        },
        student: true,
        answers: true,
      },
    });

    if (!session) {
      throw new NotFoundException(`Session ${sessionId} not found`);
    }

    // 1. Calculate raw and max scores
    let totalScore = 0;
    let maxScore = 0;
    let correctCount = 0;

    for (const mapping of session.exam.questions) {
      const q = mapping.question;
      const weight = Number(q.scoreWeight);
      maxScore += weight;

      const answer = session.answers.find((a) => a.questionId === q.id);
      if (answer && answer.awardedScore) {
        totalScore += Number(answer.awardedScore);
      }
      if (answer && answer.isCorrect) {
        correctCount++;
      }
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0;
    const passingScore = Number(session.exam.passingScore);
    const isPassed = percentage >= passingScore;

    // 2. Update session record
    const updated = await this.prisma.studentExamSession.update({
      where: { id: sessionId },
      data: {
        status: ExamSessionStatus.SUBMITTED,
        submittedAt: new Date(),
        score: new Prisma.Decimal(totalScore),
        maxScore: new Prisma.Decimal(maxScore),
        percentage: new Prisma.Decimal(percentage),
        isPassed,
      },
    });

    // 3. AUTO-SYNC TO GRADE ENGINE (Phase 5)
    let syncedToGrades = false;
    try {
      if (session.exam.component) {
        await this.gradesService.recordGrade(tenantId, studentUserId, {
          studentId: session.studentId,
          subjectId: session.exam.subjectId,
          academicYearId: session.exam.academicYearId,
          component: session.exam.component as unknown as GradeComponent,
          score: percentage,
          notes: `Hasil Ujian CBT: ${session.exam.title}`,
        });
        syncedToGrades = true;
      }
    } catch (err) {
      this.logger.warn(`Failed to auto-sync CBT score to Grade Engine: ${err.message}`);
    }

    await this.auditService.record({
      tenantId,
      userId: studentUserId,
      action: 'EXAM_SESSION_COMPLETED',
      resource: 'student_exam_sessions',
      resourceId: sessionId,
      newValues: {
        score: totalScore,
        percentage,
        isPassed,
        syncedToGrades,
      },
    });

    return {
      sessionId: updated.id,
      examId: session.examId,
      examTitle: session.exam.title,
      studentId: session.studentId,
      studentName: session.student.fullName,
      studentNis: session.student.nis,
      classGroupName: session.exam.classGroup.name,
      score: totalScore,
      maxScore,
      percentage,
      passingScore,
      isPassed,
      startedAt: session.startedAt.toISOString(),
      submittedAt: updated.submittedAt!.toISOString(),
      totalQuestions: session.exam.questions.length,
      correctAnswersCount: correctCount,
      syncedToGrades,
    };
  }

  // ===========================================================================
  // HELPERS
  // ===========================================================================

  private generateExamToken(): string {
    return crypto.randomBytes(3).toString('hex').toUpperCase();
  }

  private shuffleArray<T>(array: T[]): T[] {
    const copy = [...array];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  private mapQuestionToResponse(q: any, showAnswer = true): ExamQuestionResponseData {
    return {
      id: q.id,
      tenantId: q.tenantId,
      bankId: q.bankId,
      questionText: q.questionText,
      questionType: q.questionType,
      scoreWeight: Number(q.scoreWeight),
      options: q.options as any,
      correctAnswer: showAnswer ? q.correctAnswer : null,
      explanation: showAnswer ? q.explanation : null,
      orderIndex: q.orderIndex,
      createdAt: q.createdAt.toISOString(),
    };
  }

  private mapExamToResponse(e: any, totalQuestions = 0, totalParticipants = 0): ExamResponseData {
    return {
      id: e.id,
      tenantId: e.tenantId,
      title: e.title,
      subjectId: e.subjectId,
      subjectName: e.subject?.name,
      subjectCode: e.subject?.code,
      classGroupId: e.classGroupId,
      classGroupName: e.classGroup?.name,
      academicYearId: e.academicYearId,
      academicYearName: e.academicYear?.name,
      token: e.token,
      durationMinutes: e.durationMinutes,
      startTime: e.startTime.toISOString(),
      endTime: e.endTime.toISOString(),
      passingScore: Number(e.passingScore),
      shuffleQuestions: e.shuffleQuestions,
      shuffleOptions: e.shuffleOptions,
      isPublished: e.isPublished,
      component: e.component as unknown as GradeComponent,
      totalQuestions,
      totalParticipants,
      createdAt: e.createdAt.toISOString(),
    };
  }
}
