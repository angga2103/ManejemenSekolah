// -----------------------------------------------------------------------------
// 1. TENANCY & SUBSCRIPTION ENUMS
// -----------------------------------------------------------------------------
export enum TenantStatus {
  ACTIVE = 'ACTIVE',
  TRIAL = 'TRIAL',
  SUSPENDED = 'SUSPENDED',
  EXPIRED = 'EXPIRED',
  TERMINATED = 'TERMINATED'
}

export enum SubscriptionTier {
  BASIC = 'BASIC',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

export enum SubscriptionBillingCycle {
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  SEMI_ANNUAL = 'SEMI_ANNUAL',
  ANNUAL = 'ANNUAL'
}

// -----------------------------------------------------------------------------
// 2. IDENTITY, ROLES & PERMISSIONS ENUMS
// -----------------------------------------------------------------------------
export enum SystemRoleSlug {
  SUPER_ADMIN = 'super_admin',
  PRINCIPAL = 'principal',
  VICE_PRINCIPAL = 'vice_principal',
  OPERATOR = 'operator',
  TREASURER = 'treasurer',
  HOMEROOM_TEACHER = 'homeroom_teacher',
  SUBJECT_TEACHER = 'subject_teacher',
  USTAZ = 'ustaz',
  MUSYRIF = 'musyrif',
  SECURITY = 'security',
  STUDENT = 'student',
  PARENT = 'parent'
}

export enum PermissionAction {
  VIEW = 'VIEW',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  EXPORT = 'EXPORT',
  PRINT = 'PRINT',
  MANAGE = 'MANAGE'
}

export enum PermissionModule {
  TENANT = 'TENANT',
  USERS = 'USERS',
  MASTER_DATA = 'MASTER_DATA',
  STUDENTS = 'STUDENTS',
  GUARDIANS = 'GUARDIANS',
  EMPLOYEES = 'EMPLOYEES',
  ACADEMICS = 'ACADEMICS',
  ATTENDANCE = 'ATTENDANCE',
  FINANCE = 'FINANCE',
  PESANTREN = 'PESANTREN',
  TAHFIZ = 'TAHFIZ',
  DORMITORY = 'DORMITORY',
  LMS = 'LMS',
  EXAMINATIONS = 'EXAMINATIONS',
  COUNSELING = 'COUNSELING',
  COMMUNICATION = 'COMMUNICATION',
  REPORTS = 'REPORTS',
  AUDIT_LOGS = 'AUDIT_LOGS',
  DEV_CENTER = 'DEV_CENTER'
}

// -----------------------------------------------------------------------------
// 3. MASTER DATA ENUMS
// -----------------------------------------------------------------------------
export enum Gender {
  MALE = 'MALE',
  FEMALE = 'FEMALE'
}

export enum BloodType {
  A = 'A',
  B = 'B',
  AB = 'AB',
  O = 'O',
  UNKNOWN = 'UNKNOWN'
}

export enum StudentStatus {
  ACTIVE = 'ACTIVE',
  GRADUATED = 'GRADUATED',
  TRANSFERRED_OUT = 'TRANSFERRED_OUT',
  DROPPED_OUT = 'DROPPED_OUT',
  SUSPENDED = 'SUSPENDED'
}

export enum EmploymentStatus {
  PERMANENT = 'PERMANENT',
  CONTRACT = 'CONTRACT',
  HONORARY = 'HONORARY',
  VOLUNTEER = 'VOLUNTEER'
}

export enum GuardianRelationshipType {
  FATHER = 'FATHER',
  MOTHER = 'MOTHER',
  LEGAL_GUARDIAN = 'LEGAL_GUARDIAN',
  SIBLING = 'SIBLING',
  FOUNDATION_SPONSOR = 'FOUNDATION_SPONSOR',
  OTHER = 'OTHER'
}

// -----------------------------------------------------------------------------
// 4. ATTENDANCE & LEAVE ENUMS
// -----------------------------------------------------------------------------
export enum AttendanceType {
  CLASS = 'CLASS',
  DORMITORY = 'DORMITORY',
  PRAYER = 'PRAYER',
  PESANTREN_ACTIVITY = 'PESANTREN_ACTIVITY',
  EMPLOYEE_DUTY = 'EMPLOYEE_DUTY'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  LATE = 'LATE',
  SICK = 'SICK',
  PERMISSION = 'PERMISSION',
  DISPENSATION = 'DISPENSATION',
  ABSENT = 'ABSENT'
}

export enum AttendanceMethod {
  QR_DYNAMIC = 'QR_DYNAMIC',
  BARCODE = 'BARCODE',
  MANUAL = 'MANUAL',
  BIOMETRIC = 'BIOMETRIC',
  OFFLINE_SYNC = 'OFFLINE_SYNC'
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED'
}

// -----------------------------------------------------------------------------
// 5. FINANCE & BILLING ENUMS
// -----------------------------------------------------------------------------
export enum InvoiceStatus {
  UNPAID = 'UNPAID',
  PARTIALLY_PAID = 'PARTIALLY_PAID',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE',
  CANCELLED = 'CANCELLED'
}

export enum PaymentMethod {
  CASH = 'CASH',
  BANK_TRANSFER = 'BANK_TRANSFER',
  VIRTUAL_ACCOUNT = 'VIRTUAL_ACCOUNT',
  QRIS = 'QRIS',
  CREDIT_CARD = 'CREDIT_CARD',
  OTHER = 'OTHER'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  EXPIRED = 'EXPIRED'
}

export enum JournalLineType {
  DEBIT = 'DEBIT',
  CREDIT = 'CREDIT'
}

// -----------------------------------------------------------------------------
// 6. ACADEMIC & PESANTREN ENUMS
// -----------------------------------------------------------------------------
export enum CurriculumType {
  FORMAL_NATIONAL = 'FORMAL_NATIONAL',
  PESANTREN_DINIYAH = 'PESANTREN_DINIYAH',
  TAHFIZ_QURAN = 'TAHFIZ_QURAN',
  EXTRACURRICULAR = 'EXTRACURRICULAR'
}

export enum SemesterType {
  ODD = 'ODD',
  EVEN = 'EVEN'
}

export enum GradeComponent {
  DAILY_TASK = 'DAILY_TASK',
  QUIZ = 'QUIZ',
  MID_EXAM = 'MID_EXAM',
  FINAL_EXAM = 'FINAL_EXAM',
  PRACTICAL = 'PRACTICAL',
  CHARACTER_ATTITUDE = 'CHARACTER_ATTITUDE'
}

export enum TahfizRecordType {
  ZIYADAH = 'ZIYADAH',
  MUROJA_AH = 'MUROJA_AH'
}

export enum TahfizFluencyRating {
  MUMTAZ = 'MUMTAZ',
  JAYYID_JIDDAN = 'JAYYID_JIDDAN',
  JAYYID = 'JAYYID',
  MAQBUL = 'MAQBUL',
  RASIB = 'RASIB'
}

// -----------------------------------------------------------------------------
// 7. OFFLINE SYNC ENUMS
// -----------------------------------------------------------------------------
export enum SyncStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CONFLICT = 'CONFLICT',
  FAILED = 'FAILED'
}

export enum SyncOperationType {
  ATTENDANCE_SCAN = 'ATTENDANCE_SCAN',
  LEAVE_REQUEST = 'LEAVE_REQUEST',
  TAHFIZ_LOG = 'TAHFIZ_LOG',
  DISCIPLINE_NOTE = 'DISCIPLINE_NOTE'
}

// -----------------------------------------------------------------------------
// 8. NOTIFICATION ENUMS
// -----------------------------------------------------------------------------
export enum NotificationChannel {
  IN_APP = 'IN_APP',
  PUSH = 'PUSH',
  WHATSAPP = 'WHATSAPP',
  SMS = 'SMS',
  EMAIL = 'EMAIL'
}

export enum NotificationStatus {
  PENDING = 'PENDING',
  SENT = 'SENT',
  FAILED = 'FAILED',
  READ = 'READ'
}

// -----------------------------------------------------------------------------
// 9. LMS & EXAMINATIONS (CBT) ENUMS
// -----------------------------------------------------------------------------
export enum MaterialType {
  DOCUMENT = 'DOCUMENT',
  VIDEO = 'VIDEO',
  ARTICLE = 'ARTICLE',
  LINK = 'LINK'
}

export enum AssignmentStatus {
  PENDING = 'PENDING',
  SUBMITTED = 'SUBMITTED',
  LATE = 'LATE',
  GRADED = 'GRADED',
  RESUBMISSION_REQUESTED = 'RESUBMISSION_REQUESTED'
}

export enum QuestionType {
  MULTIPLE_CHOICE = 'MULTIPLE_CHOICE',
  ESSAY = 'ESSAY',
  TRUE_FALSE = 'TRUE_FALSE'
}

export enum ExamSessionStatus {
  IN_PROGRESS = 'IN_PROGRESS',
  SUBMITTED = 'SUBMITTED',
  TIMED_OUT = 'TIMED_OUT',
  GRADED = 'GRADED'
}

// -----------------------------------------------------------------------------
// 10. PESANTREN & DORMITORY ENUMS
// -----------------------------------------------------------------------------
export enum PesantrenPermitType {
  PULANG_KE_RUMAH = 'PULANG_KE_RUMAH',
  KELUAR_KOMPLEKS = 'KELUAR_KOMPLEKS',
  RUMAH_SAKIT = 'RUMAH_SAKIT',
  LAINNYA = 'LAINNYA'
}

export enum PesantrenPermitStatus {
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED_BY_MUSYRIF = 'APPROVED_BY_MUSYRIF',
  APPROVED_BY_KEASRAMAAN = 'APPROVED_BY_KEASRAMAAN',
  REJECTED = 'REJECTED',
  ACTIVE_OUTSIDE = 'ACTIVE_OUTSIDE',
  RETURNED = 'RETURNED',
  OVERDUE = 'OVERDUE'
}

// -----------------------------------------------------------------------------
// 11. DISCIPLINE, COUNSELING & COMMUNICATION ENUMS
// -----------------------------------------------------------------------------
export enum ComplaintPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export enum ComplaintStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED'
}

export enum ViolationLevel {
  RINGAN = 'RINGAN',
  SEDANG = 'SEDANG',
  BERAT = 'BERAT'
}

export enum SanctionLetterType {
  NONE = 'NONE',
  SP1 = 'SP1',
  SP2 = 'SP2',
  SP3_CALL_PARENT = 'SP3_CALL_PARENT'
}

export enum CounselingCategory {
  ACADEMIC = 'ACADEMIC',
  BEHAVIORAL = 'BEHAVIORAL',
  FAMILY = 'FAMILY',
  PERSONAL = 'PERSONAL',
  CAREER = 'CAREER'
}

export enum AchievementLevel {
  INTERNAL = 'INTERNAL',
  KECAMATAN = 'KECAMATAN',
  KABUPATEN = 'KABUPATEN',
  PROVINSI = 'PROVINSI',
  NASIONAL = 'NASIONAL',
  INTERNASIONAL = 'INTERNASIONAL'
}
// -----------------------------------------------------------------------------
// 12. SAAS SUBSCRIPTIONS & DEVELOPER CONTROL CENTER ENUMS
// -----------------------------------------------------------------------------
export enum SaaSModuleKey {
  MASTER_DATA = 'MASTER_DATA',
  USERS_RBAC = 'USERS_RBAC',
  ATTENDANCE = 'ATTENDANCE',
  FINANCE = 'FINANCE',
  ACADEMICS = 'ACADEMICS',
  LMS_CBT = 'LMS_CBT',
  PESANTREN = 'PESANTREN',
  TAHFIZ = 'TAHFIZ',
  DORMITORY = 'DORMITORY',
  DISCIPLINE = 'DISCIPLINE',
  COUNSELING = 'COUNSELING',
  COMMUNICATION = 'COMMUNICATION'
}

export enum SystemHealthStatus {
  HEALTHY = 'HEALTHY',
  DEGRADED = 'DEGRADED',
  CRITICAL = 'CRITICAL'
}
