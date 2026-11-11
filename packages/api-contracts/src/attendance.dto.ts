import {
  AttendanceType,
  AttendanceStatus,
  AttendanceMethod,
  LeaveStatus,
  NotificationChannel,
  NotificationStatus,
  OfflineSyncItemPayload,
} from '@edusaas/shared-types';

// -----------------------------------------------------------------------------
// LEGACY COMPATIBILITY DTOS
// -----------------------------------------------------------------------------
export interface ScanAttendanceRequestDto {
  studentId?: string;
  employeeId?: string;
  type: AttendanceType;
  status: AttendanceStatus;
  method: AttendanceMethod;
  signedToken?: string;
  deviceId?: string;
  latitude?: number;
  longitude?: number;
  recordedTimestamp: number;
}

export interface SyncBatchAttendanceRequestDto {
  deviceId: string;
  batchId: string;
  items: OfflineSyncItemPayload[];
}

// -----------------------------------------------------------------------------
// DYNAMIC QR CODE TYPES & DTOS
// -----------------------------------------------------------------------------
export interface GenerateDynamicQrDto {
  institutionId?: string;
  type: AttendanceType;
  classGroupId?: string;
  dormitoryId?: string;
  validitySeconds?: number; // default: 60
}

export interface DynamicQrPayload {
  tenantId: string;
  type: AttendanceType;
  nonce: string;
  expiresAt: number; // Unix timestamp ms
  createdAt: number; // Unix timestamp ms
  metadata?: {
    institutionId?: string;
    classGroupId?: string;
    dormitoryId?: string;
  };
  signature: string; // HMAC-SHA256
}

export interface VerifyDynamicQrDto {
  token: string;
  studentId: string;
  deviceId?: string;
  latitude?: number;
  longitude?: number;
}

// -----------------------------------------------------------------------------
// RECORD ATTENDANCE DTOS
// -----------------------------------------------------------------------------
export interface RecordAttendanceDto {
  studentId: string;
  type?: AttendanceType;
  status?: AttendanceStatus;
  method?: AttendanceMethod;
  recordedDate?: string; // YYYY-MM-DD
  checkInTime?: string; // ISO 8601
  checkOutTime?: string; // ISO 8601
  deviceId?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface ManualClassRollCallItemDto {
  studentId: string;
  status: AttendanceStatus;
  notes?: string;
}

export interface ManualClassRollCallDto {
  classGroupId: string;
  recordedDate: string; // YYYY-MM-DD
  type?: AttendanceType;
  items: ManualClassRollCallItemDto[];
}

export interface AttendanceCorrectionDto {
  newStatus: AttendanceStatus;
  notes: string;
}

export interface AttendanceFilterDto {
  recordedDate?: string;
  startDate?: string;
  endDate?: string;
  studentId?: string;
  classGroupId?: string;
  type?: AttendanceType;
  status?: AttendanceStatus;
  page?: number;
  limit?: number;
}

export interface AttendanceResponseData {
  id: string;
  tenantId: string;
  studentId: string | null;
  studentName?: string;
  studentNis?: string;
  classGroupName?: string;
  type: AttendanceType;
  status: AttendanceStatus;
  method: AttendanceMethod;
  recordedDate: string;
  checkInTime: string | null;
  checkOutTime: string | null;
  deviceId: string | null;
  latitude: number | null;
  longitude: number | null;
  notes: string | null;
  createdAt: string;
}

export interface AttendanceSummaryDto {
  recordedDate: string;
  type: AttendanceType;
  totalStudents: number;
  presentCount: number;
  lateCount: number;
  sickCount: number;
  permissionCount: number;
  dispensationCount: number;
  absentCount: number;
  attendanceRatePercentage: number;
}

// -----------------------------------------------------------------------------
// OFFLINE SYNC BATCH DTOS
// -----------------------------------------------------------------------------
export interface OfflineSyncAttendanceItemDto {
  clientRecordId: string;
  studentId: string;
  type: AttendanceType;
  status: AttendanceStatus;
  method: AttendanceMethod;
  recordedDate: string; // YYYY-MM-DD
  checkInTime?: string; // ISO 8601
  checkOutTime?: string; // ISO 8601
  deviceId?: string;
  latitude?: number;
  longitude?: number;
  notes?: string;
}

export interface OfflineSyncBatchRequestDto {
  deviceId: string;
  batchTimestamp: string; // ISO 8601
  records: OfflineSyncAttendanceItemDto[];
}

export interface OfflineSyncBatchFailure {
  clientRecordId: string;
  studentId: string;
  reason: string;
}

export interface OfflineSyncBatchResultDto {
  syncedCount: number;
  duplicateCount: number;
  failedCount: number;
  failures: OfflineSyncBatchFailure[];
}

// -----------------------------------------------------------------------------
// LEAVE REQUESTS (IZIN / SAKIT / DISPENSASI) DTOS
// -----------------------------------------------------------------------------
export interface CreateLeaveRequestDto {
  studentId: string;
  reason: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  type?: AttendanceStatus; // SICK | PERMISSION | DISPENSATION (default: PERMISSION)
}

export interface ApproveLeaveRequestDto {
  status: LeaveStatus.APPROVED | LeaveStatus.REJECTED;
  notes?: string;
}

export interface LeaveRequestResponseData {
  id: string;
  tenantId: string;
  studentId: string;
  studentName?: string;
  studentNis?: string;
  classGroupName?: string;
  reason: string;
  startDate: string;
  endDate: string;
  status: LeaveStatus;
  approvedByEmployeeId: string | null;
  approvedByEmployeeName?: string;
  createdAt: string;
  updatedAt: string;
}

// -----------------------------------------------------------------------------
// NOTIFICATIONS DTOS
// -----------------------------------------------------------------------------
export interface NotificationItemData {
  id: string;
  tenantId: string;
  userId: string | null;
  title: string;
  body: string;
  channel: NotificationChannel;
  status: NotificationStatus;
  category: string | null;
  metadata?: Record<string, any> | null;
  readAt: string | null;
  createdAt: string;
}

export interface SendNotificationDto {
  userId?: string;
  title: string;
  body: string;
  channel?: NotificationChannel;
  category?: string;
  metadata?: Record<string, any>;
}

export interface RegisterDeviceTokenDto {
  fcmToken: string;
  platform: 'ANDROID' | 'IOS' | 'WEB';
  deviceModel?: string;
}
