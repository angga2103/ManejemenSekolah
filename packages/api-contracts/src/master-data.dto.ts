import {
  Gender,
  StudentStatus,
  GuardianRelationshipType,
  CurriculumType,
} from '@edusaas/shared-types';

// ==============================================================================
// 1. INSTITUTIONS & DEPARTMENTS
// ==============================================================================
export interface CreateInstitutionDto {
  name: string;
  code: string;
  npsn?: string;
  type: string; // FORMAL_SCHOOL, PESANTREN, MADRASAH
}

export interface UpdateInstitutionDto {
  name?: string;
  code?: string;
  npsn?: string;
  type?: string;
}

export interface InstitutionResponseData {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  npsn?: string | null;
  type: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ==============================================================================
// 2. ACADEMIC YEARS & SEMESTERS
// ==============================================================================
export interface CreateAcademicYearDto {
  name: string; // e.g. "2026/2027 Ganjil"
  semester: string; // ODD, EVEN
  startDate: string | Date;
  endDate: string | Date;
  isActive?: boolean;
}

export interface UpdateAcademicYearDto {
  name?: string;
  semester?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  isActive?: boolean;
}

export interface AcademicYearResponseData {
  id: string;
  tenantId: string;
  name: string;
  semester: string;
  startDate: string | Date;
  endDate: string | Date;
  isActive: boolean;
  createdAt: string | Date;
}

// ==============================================================================
// 3. CLASS GROUPS & ROSTERS
// ==============================================================================
export interface CreateClassGroupDto {
  institutionId: string;
  academicYearId: string;
  name: string; // e.g. "10 MIPA 1"
  gradeLevel: number;
  homeroomTeacherId?: string;
}

export interface UpdateClassGroupDto {
  institutionId?: string;
  academicYearId?: string;
  name?: string;
  gradeLevel?: number;
  homeroomTeacherId?: string;
}

export interface ClassGroupResponseData {
  id: string;
  tenantId: string;
  institutionId: string;
  academicYearId: string;
  name: string;
  gradeLevel: number;
  homeroomTeacherId?: string | null;
  homeroomTeacherName?: string | null;
  studentCount?: number;
  createdAt: string | Date;
}

export interface AssignStudentToClassDto {
  studentId: string;
  classGroupId: string;
}

// ==============================================================================
// 4. STUDENTS (SANTRI / SISWA)
// ==============================================================================
export interface CreateStudentDto {
  nis: string;
  nisn?: string;
  nik?: string;
  fullName: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string | Date;
  admissionYear: number;
  status?: StudentStatus;
  classGroupId?: string;
}

export interface UpdateStudentDto {
  nis?: string;
  nisn?: string;
  nik?: string;
  fullName?: string;
  gender?: Gender;
  birthPlace?: string;
  birthDate?: string | Date;
  admissionYear?: number;
  status?: StudentStatus;
  classGroupId?: string;
}

export interface StudentFilterQueryDto {
  search?: string; // Search by name, NIS, NISN
  classGroupId?: string;
  status?: StudentStatus;
  gender?: Gender;
  page?: number;
  limit?: number;
}

export interface StudentResponseData {
  id: string;
  tenantId: string;
  userId?: string | null;
  nis: string;
  nisn?: string | null;
  nik?: string | null;
  fullName: string;
  gender: Gender;
  birthPlace: string;
  birthDate: string | Date;
  status: StudentStatus;
  admissionYear: number;
  currentClass?: {
    id: string;
    name: string;
    gradeLevel: number;
  } | null;
  guardiansCount?: number;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// ==============================================================================
// 5. GUARDIANS & RELATIONSHIPS
// ==============================================================================
export interface CreateGuardianDto {
  fullName: string;
  phone: string;
  email?: string;
  nik?: string;
  occupation?: string;
  address?: string;
}

export interface UpdateGuardianDto {
  fullName?: string;
  phone?: string;
  email?: string;
  nik?: string;
  occupation?: string;
  address?: string;
}

export interface GuardianResponseData {
  id: string;
  tenantId: string;
  userId: string;
  fullName: string;
  phone: string;
  email?: string | null;
  nik?: string | null;
  occupation?: string | null;
  address?: string | null;
  linkedStudentsCount?: number;
  createdAt: string | Date;
}

export interface LinkStudentGuardianDto {
  studentId: string;
  guardianId: string;
  relationshipType: GuardianRelationshipType;
  isPrimary?: boolean;
  hasFinancialAccess?: boolean;
  isEmergencyContact?: boolean;
  receivePush?: boolean;
  receiveWhatsapp?: boolean;
}

export interface UpdateStudentGuardianDto {
  relationshipType?: GuardianRelationshipType;
  isPrimary?: boolean;
  hasFinancialAccess?: boolean;
  isEmergencyContact?: boolean;
  receivePush?: boolean;
  receiveWhatsapp?: boolean;
}

export interface StudentGuardianLinkResponseData {
  id: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  guardianId: string;
  guardianName?: string;
  guardianPhone?: string;
  relationshipType: GuardianRelationshipType;
  isPrimary: boolean;
  hasFinancialAccess: boolean;
  isEmergencyContact: boolean;
  receivePush: boolean;
  receiveWhatsapp: boolean;
  createdAt: string | Date;
}

// ==============================================================================
// 6. EMPLOYEES & TEACHERS
// ==============================================================================
export interface CreateEmployeeDto {
  nip?: string;
  fullName: string;
  gender: Gender;
  position: string;
  employmentStatus?: string;
  email: string;
  phone?: string;
  roleSlug?: string;
}

export interface UpdateEmployeeDto {
  nip?: string;
  fullName?: string;
  gender?: Gender;
  position?: string;
  employmentStatus?: string;
  phone?: string;
}

export interface EmployeeResponseData {
  id: string;
  tenantId: string;
  userId: string;
  nip?: string | null;
  fullName: string;
  gender: Gender;
  position: string;
  employmentStatus: string;
  email?: string | null;
  phone?: string | null;
  createdAt: string | Date;
}

// ==============================================================================
// 7. SUBJECTS & CURRICULUM
// ==============================================================================
export interface CreateSubjectDto {
  institutionId: string;
  name: string;
  code: string;
  curriculumType?: string;
}

export interface UpdateSubjectDto {
  institutionId?: string;
  name?: string;
  code?: string;
  curriculumType?: string;
}

export interface SubjectResponseData {
  id: string;
  tenantId: string;
  institutionId: string;
  name: string;
  code: string;
  curriculumType: string;
  createdAt?: string | Date;
}

// ==============================================================================
// 8. BATCH IMPORT / EXPORT
// ==============================================================================
export interface StudentBatchImportItem {
  nis: string;
  nisn?: string;
  nik?: string;
  fullName: string;
  gender: 'MALE' | 'FEMALE';
  birthPlace: string;
  birthDate: string; // YYYY-MM-DD
  admissionYear: number;
  className?: string;
  guardianName?: string;
  guardianPhone?: string;
  relationship?: 'FATHER' | 'MOTHER' | 'LEGAL_GUARDIAN' | 'OTHER';
}

export interface StudentBatchImportResult {
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  errors: Array<{
    row: number;
    nis: string;
    reason: string;
  }>;
}
