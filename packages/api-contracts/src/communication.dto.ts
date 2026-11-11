import {
  ComplaintPriority,
  ComplaintStatus,
  SanctionLetterType,
  CounselingCategory,
  AchievementLevel,
} from '@edusaas/shared-types';

// =============================================================================
// STUDENT DISCIPLINE & VIOLATION DTOs
// =============================================================================

export class RecordViolationDto {
  studentId!: string;
  recordedByEmployeeId!: string;
  title!: string;
  violationDate!: string;
  points!: number;
  sanction?: string;
  status?: string;
}

export class StudentDisciplineSummaryDto {
  studentId!: string;
  studentName!: string;
  studentNis!: string;
  totalPoints!: number;
  sanctionLetter!: SanctionLetterType;
  violationCount!: number;
  latestViolationDate?: string | null;
}

export class ViolationResponseData {
  id!: string;
  tenantId!: string;
  studentId!: string;
  studentName!: string;
  studentNis!: string;
  recordedByEmployeeId!: string;
  recordedByName!: string;
  violationDate!: string;
  title!: string;
  points!: number;
  sanction?: string | null;
  status!: string;
  createdAt!: string;
}

// =============================================================================
// STUDENT ACHIEVEMENT DTOs
// =============================================================================

export class RecordAchievementDto {
  studentId!: string;
  title!: string;
  level!: AchievementLevel | string;
  achievementDate!: string;
  points?: number;
  certificateUrl?: string;
}

export class AchievementResponseData {
  id!: string;
  tenantId!: string;
  studentId!: string;
  studentName!: string;
  studentNis!: string;
  title!: string;
  level!: string;
  achievementDate!: string;
  points!: number;
  certificateUrl?: string | null;
  createdAt!: string;
}

// =============================================================================
// COUNSELING (BK) DTOs
// =============================================================================

export class CreateCounselingSessionDto {
  studentId!: string;
  counselorEmployeeId!: string;
  sessionDate!: string;
  category!: CounselingCategory | string;
  notes!: string;
  actionPlan?: string;
  followUpRequired?: boolean;
}

export class CounselingResponseData {
  id!: string;
  tenantId!: string;
  studentId!: string;
  studentName!: string;
  studentNis!: string;
  counselorEmployeeId!: string;
  counselorName!: string;
  sessionDate!: string;
  category!: string;
  notes!: string;
  actionPlan?: string | null;
  followUpRequired!: boolean;
  createdAt!: string;
}

// =============================================================================
// COMPLAINT DESK & ANNOUNCEMENT DTOs
// =============================================================================

export class CreateComplaintDto {
  title!: string;
  description!: string;
  category!: string;
  priority?: ComplaintPriority;
}

export class ResolveComplaintDto {
  status!: ComplaintStatus;
  resolutionNotes!: string;
}

export class ComplaintResponseData {
  id!: string;
  tenantId!: string;
  userId!: string;
  userName!: string;
  userEmail?: string | null;
  title!: string;
  description!: string;
  category!: string;
  priority!: ComplaintPriority;
  status!: ComplaintStatus;
  resolutionNotes?: string | null;
  createdAt!: string;
  updatedAt!: string;
  resolvedAt?: string | null;
}

export class CreateAnnouncementDto {
  title!: string;
  content!: string;
  targetAudience?: string; // ALL, TEACHERS, STUDENTS, GUARDIANS
  expiresAt?: string;
}

export class AnnouncementResponseData {
  id!: string;
  tenantId!: string;
  title!: string;
  content!: string;
  targetAudience!: string;
  isPublished!: boolean;
  publishedAt!: string;
  expiresAt?: string | null;
}
