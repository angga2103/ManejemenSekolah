import { QuestionType, ExamSessionStatus, GradeComponent } from '@edusaas/shared-types';

// -----------------------------------------------------------------------------
// QUESTION BANK & QUESTIONS (BANK SOAL & BUTIR SOAL)
// -----------------------------------------------------------------------------
export interface QuestionOptionDto {
  id: string; // 'A', 'B', 'C', 'D', 'E'
  text: string;
}

export interface CreateQuestionBankDto {
  subjectId: string;
  title: string;
  curriculumType?: string;
}

export interface CreateExamQuestionDto {
  bankId: string;
  questionText: string;
  questionType: QuestionType;
  scoreWeight?: number; // default: 1.0
  options?: QuestionOptionDto[];
  correctAnswer: string;
  explanation?: string;
  orderIndex?: number;
}

export interface QuestionBankResponseData {
  id: string;
  tenantId: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  curriculumType?: string;
  title: string;
  authorEmployeeId?: string | null;
  authorName?: string | null;
  totalQuestions: number;
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestionResponseData {
  id: string;
  tenantId: string;
  bankId: string;
  questionText: string;
  questionType: QuestionType;
  scoreWeight: number;
  options?: QuestionOptionDto[] | null;
  correctAnswer?: string | null; // Hidden for students during exam
  explanation?: string | null;
  orderIndex: number;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// CBT EXAM PACKAGES (PAKET & JADWAL UJIAN CBT)
// -----------------------------------------------------------------------------
export interface CreateExamDto {
  title: string;
  subjectId: string;
  classGroupId: string;
  academicYearId: string;
  token?: string;
  durationMinutes: number; // e.g. 60 or 90
  startTime: string; // ISO 8601
  endTime: string; // ISO 8601
  passingScore?: number; // default: 75
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  isPublished?: boolean;
  component?: GradeComponent; // default: FINAL_EXAM
  questionIds: string[];
}

export interface ExamFilterDto {
  subjectId?: string;
  classGroupId?: string;
  academicYearId?: string;
  isPublished?: boolean;
  page?: number;
  limit?: number;
}

export interface ExamResponseData {
  id: string;
  tenantId: string;
  title: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  classGroupId: string;
  classGroupName?: string;
  academicYearId: string;
  academicYearName?: string;
  token: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  passingScore: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  isPublished: boolean;
  component: GradeComponent;
  totalQuestions: number;
  totalParticipants?: number;
  createdAt: string;
}

// -----------------------------------------------------------------------------
// CBT EXAM SESSIONS & ANSWERS (SESI UJIAN & AUTOSAVE SANTRI)
// -----------------------------------------------------------------------------
export interface StartExamSessionDto {
  examId: string;
  token: string;
}

export interface SubmitExamAnswerDto {
  questionId: string;
  selectedOption?: string;
  essayAnswer?: string;
}

export interface ExamSessionResponseData {
  id: string;
  tenantId: string;
  examId: string;
  examTitle: string;
  durationMinutes: number;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  startedAt: string;
  submittedAt?: string | null;
  status: ExamSessionStatus;
  remainingSeconds: number;
  totalQuestions: number;
  answeredQuestions: number;
  questions?: ExamQuestionResponseData[];
}

export interface ExamResultDetailResponseData {
  sessionId: string;
  examId: string;
  examTitle: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  classGroupName: string;
  score: number;
  maxScore: number;
  percentage: number;
  passingScore: number;
  isPassed: boolean;
  startedAt: string;
  submittedAt: string;
  totalQuestions: number;
  correctAnswersCount: number;
  syncedToGrades: boolean;
}
