import {
  TenantStatus,
  SubscriptionTier,
  SystemRoleSlug,
  PermissionAction,
  PermissionModule,
  Gender,
  StudentStatus,
  GuardianRelationshipType,
  AttendanceType,
  AttendanceStatus,
  AttendanceMethod,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  CurriculumType,
  SemesterType,
  TahfizRecordType,
  TahfizFluencyRating,
  SyncStatus,
  SyncOperationType
} from '../enums/index.js';

// Base Tenant Scoped Model
export interface BaseTenantEntity {
  id: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// 1. Tenancy
export interface TenantModel {
  id: string;
  name: string;
  slug: string;
  subdomain: string;
  customDomain?: string | null;
  status: TenantStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface TenantSettingsModel {
  id: string;
  tenantId: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
  timezone: string;
  dateFormat: string;
  currency: string;
  isFormalEnabled: boolean;
  isPesantrenEnabled: boolean;
}

// 2. Identity & Access
export interface UserModel extends BaseTenantEntity {
  email?: string | null;
  phone?: string | null;
  isActive: boolean;
  mfaEnabled: boolean;
  lastLoginAt?: Date | null;
}

export interface RoleModel extends BaseTenantEntity {
  name: string;
  slug: SystemRoleSlug | string;
  isSystem: boolean;
  description?: string | null;
}

export interface PermissionModel {
  id: string;
  module: PermissionModule;
  action: PermissionAction;
  description?: string | null;
}

// 3. People & Guardian Relationships
export interface StudentModel extends BaseTenantEntity {
  userId?: string | null;
  nis: string;
  nisn?: string | null;
  fullName: string;
  nickname?: string | null;
  gender: Gender;
  birthPlace: string;
  birthDate: Date;
  status: StudentStatus;
  currentClassId?: string | null;
  dormRoomId?: string | null;
}

export interface GuardianModel extends BaseTenantEntity {
  userId: string;
  fullName: string;
  nik?: string | null;
  phone: string;
  email?: string | null;
  address?: string | null;
  occupation?: string | null;
}

export interface StudentGuardianLinkModel extends BaseTenantEntity {
  studentId: string;
  guardianId: string;
  relationshipType: GuardianRelationshipType;
  isPrimary: boolean;
  hasFinancialAccess: boolean;
  isEmergencyContact: boolean;
  receivePushNotifications: boolean;
  receiveWhatsappNotifications: boolean;
}

// 4. Attendance
export interface AttendanceRecordModel extends BaseTenantEntity {
  studentId?: string | null;
  employeeId?: string | null;
  type: AttendanceType;
  status: AttendanceStatus;
  method: AttendanceMethod;
  recordedDate: Date;
  checkInTime?: Date | null;
  checkOutTime?: Date | null;
  recordedByUserId?: string | null;
  deviceId?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  notes?: string | null;
}

// 5. Finance
export interface InvoiceModel extends BaseTenantEntity {
  studentId: string;
  invoiceNumber: string;
  billingCategoryId: string;
  title: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InvoiceStatus;
  dueDate: Date;
}

export interface PaymentModel extends BaseTenantEntity {
  invoiceId: string;
  transactionCode: string;
  amountPaid: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  idempotencyKey?: string | null;
  gatewayReference?: string | null;
  receiptNumber?: string | null;
  paidAt: Date;
}

// 6. Pesantren & Tahfiz
export interface TahfizRecordModel extends BaseTenantEntity {
  studentId: string;
  musyrifId: string;
  recordType: TahfizRecordType;
  surahNumber: number;
  surahName: string;
  ayatStart: number;
  ayatEnd: number;
  juz: number;
  fluencyRating: TahfizFluencyRating;
  notes?: string | null;
  recordedAt: Date;
}

// 7. Offline Sync
export interface OfflineSyncItemPayload {
  operationId: string; // UUID generated locally
  tenantId: string;
  operationType: SyncOperationType;
  eventTimestamp: number;
  data: Record<string, unknown>;
  signature?: string;
}

export interface OfflineSyncBatchRequest {
  deviceId: string;
  batchId: string;
  items: OfflineSyncItemPayload[];
}

export interface OfflineSyncBatchResponse {
  batchId: string;
  processedCount: number;
  successIds: string[];
  failedItems: Array<{
    operationId: string;
    errorCode: string;
    errorMessage: string;
  }>;
}

// 8. Audit Log
export interface AuditLogModel {
  id: string;
  tenantId: string;
  userId?: string | null;
  action: string;
  resource: string;
  resourceId?: string | null;
  oldValues?: Record<string, unknown> | null;
  newValues?: Record<string, unknown> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}
