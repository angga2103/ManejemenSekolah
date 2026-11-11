import {
  AttendanceType,
  AttendanceStatus,
  AttendanceMethod,
  OfflineSyncItemPayload
} from '@edusaas/shared-types';

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
