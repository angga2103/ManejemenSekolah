import { GradeComponent } from '@edusaas/shared-types';

// -----------------------------------------------------------------------------
// GRADES ENTRY & BATCH INPUT DTOS
// -----------------------------------------------------------------------------
export interface CreateGradeDto {
  studentId: string;
  subjectId: string;
  academicYearId: string;
  component: GradeComponent;
  score: number; // 0 - 100
  weight?: number; // default: 1.0
  notes?: string;
}

export interface BatchGradeItemDto {
  studentId: string;
  score: number;
  notes?: string;
}

export interface BatchInputGradesDto {
  subjectId: string;
  academicYearId: string;
  component: GradeComponent;
  classGroupId: string;
  weight?: number;
  items: BatchGradeItemDto[];
}

export interface GradeFilterDto {
  studentId?: string;
  subjectId?: string;
  academicYearId?: string;
  classGroupId?: string;
  component?: GradeComponent;
  page?: number;
  limit?: number;
}

export interface GradeResponseData {
  id: string;
  tenantId: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  curriculumType?: string;
  academicYearId: string;
  academicYearName?: string;
  component: GradeComponent;
  score: number;
  weight: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// SUBJECT SCORE SUMMARY & COMPETENCY
// -----------------------------------------------------------------------------
export interface SubjectScoreSummaryDto {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  curriculumType: string;
  kkm: number;
  dailyTaskScore: number | null;
  quizScore: number | null;
  midExamScore: number | null;
  finalExamScore: number | null;
  practicalScore: number | null;
  characterScore: number | null;
  finalScore: number;
  predicate: 'A' | 'B' | 'C' | 'D';
  isPassed: boolean;
  competencyDescription: string;
}

// -----------------------------------------------------------------------------
// REPORT CARDS (RAPOR DIGITAL) DTOS
// -----------------------------------------------------------------------------
export interface GenerateReportCardDto {
  studentId: string;
  classGroupId: string;
  academicYearId: string;
  semester: string; // 'ODD' | 'EVEN' | 'Ganjil' | 'Genap'
  remarks?: string;
  kkm?: number;
}

export interface GenerateBatchReportCardsDto {
  classGroupId: string;
  academicYearId: string;
  semester: string;
  kkm?: number;
}

export interface ReportCardAttendanceSummary {
  presentCount: number;
  lateCount: number;
  sickCount: number;
  permissionCount: number;
  absentCount: number;
}

export interface ReportCardResponseData {
  id: string;
  tenantId: string;
  studentId: string;
  studentName: string;
  studentNis: string;
  studentNisn?: string | null;
  classGroupId: string;
  classGroupName: string;
  academicYearId: string;
  academicYearName: string;
  semester: string;
  finalAverage: number;
  overallPredicate: 'A' | 'B' | 'C' | 'D';
  ranking: number | null;
  totalStudentsInClass: number;
  remarks: string | null;
  pdfUrl: string | null;
  issuedAt: string;
  subjects: SubjectScoreSummaryDto[];
  attendanceSummary: ReportCardAttendanceSummary;
}

export interface ReportCardFilterDto {
  studentId?: string;
  classGroupId?: string;
  academicYearId?: string;
  semester?: string;
  page?: number;
  limit?: number;
}
