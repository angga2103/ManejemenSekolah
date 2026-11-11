import { MaterialType, AssignmentStatus } from '@edusaas/shared-types';

// -----------------------------------------------------------------------------
// COURSE MATERIALS (MATERI BELAJAR DIGITAL)
// -----------------------------------------------------------------------------
export interface CreateCourseMaterialDto {
  subjectId: string;
  classGroupId?: string;
  title: string;
  description?: string;
  materialType: MaterialType;
  fileUrl?: string;
  content?: string;
  isPublished?: boolean;
}

export interface UpdateCourseMaterialDto {
  title?: string;
  description?: string;
  materialType?: MaterialType;
  fileUrl?: string;
  content?: string;
  isPublished?: boolean;
}

export interface CourseMaterialFilterDto {
  subjectId?: string;
  classGroupId?: string;
  materialType?: MaterialType;
  search?: string;
  page?: number;
  limit?: number;
}

export interface CourseMaterialResponseData {
  id: string;
  tenantId: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  curriculumType?: string;
  classGroupId?: string | null;
  classGroupName?: string | null;
  authorEmployeeId?: string | null;
  authorName?: string | null;
  title: string;
  description?: string | null;
  materialType: MaterialType;
  fileUrl?: string | null;
  content?: string | null;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// ASSIGNMENTS & SUBMISSIONS (TUGAS SANTRI)
// -----------------------------------------------------------------------------
export interface CreateAssignmentDto {
  subjectId: string;
  classGroupId: string;
  title: string;
  instructions: string;
  attachmentUrl?: string;
  dueDate: string; // ISO 8601
  maxScore?: number; // default: 100
  isPublished?: boolean;
}

export interface AssignmentFilterDto {
  subjectId?: string;
  classGroupId?: string;
  studentId?: string;
  page?: number;
  limit?: number;
}

export interface AssignmentResponseData {
  id: string;
  tenantId: string;
  subjectId: string;
  subjectName?: string;
  subjectCode?: string;
  classGroupId: string;
  classGroupName?: string;
  teacherEmployeeId?: string | null;
  teacherName?: string | null;
  title: string;
  instructions: string;
  attachmentUrl?: string | null;
  dueDate: string;
  maxScore: number;
  isPublished: boolean;
  totalSubmissions?: number;
  gradedSubmissions?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubmitAssignmentDto {
  fileUrl?: string;
  content?: string;
}

export interface GradeAssignmentDto {
  score: number; // 0 - 100
  feedback?: string;
}

export interface AssignmentSubmissionResponseData {
  id: string;
  tenantId: string;
  assignmentId: string;
  assignmentTitle?: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  submittedAt: string;
  fileUrl?: string | null;
  content?: string | null;
  score?: number | null;
  feedback?: string | null;
  gradedByEmployeeId?: string | null;
  gradedByName?: string | null;
  gradedAt?: string | null;
  status: AssignmentStatus;
  createdAt: string;
}
