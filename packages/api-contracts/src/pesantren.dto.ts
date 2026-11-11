import {
  Gender,
  TahfizRecordType,
  TahfizFluencyRating,
  PesantrenPermitType,
  PesantrenPermitStatus
} from '@edusaas/shared-types';

// =============================================================================
// DORMITORY & ROOM DTOs
// =============================================================================

export class CreateDormitoryDto {
  name!: string;
  gender!: Gender;
  buildingCode?: string;
  description?: string;
}

export class CreateDormRoomDto {
  dormitoryId!: string;
  roomNumber!: string;
  floor?: number;
  capacity?: number;
  description?: string;
}

export class AllocateStudentBedDto {
  roomId!: string;
  studentId!: string;
  bedNumber?: string;
  startDate!: string;
  notes?: string;
}

export class DormAllocationResponseData {
  id!: string;
  tenantId!: string;
  roomId!: string;
  roomNumber!: string;
  dormitoryId!: string;
  dormitoryName!: string;
  studentId!: string;
  studentName!: string;
  studentNis!: string;
  bedNumber?: string | null;
  startDate!: string;
  endDate?: string | null;
  isActive!: boolean;
  notes?: string | null;
}

export class DormRoomResponseData {
  id!: string;
  dormitoryId!: string;
  roomNumber!: string;
  floor!: number;
  capacity!: number;
  currentOccupancy!: number;
  availableSlots!: number;
  description?: string | null;
  allocations?: DormAllocationResponseData[];
}

export class DormitoryResponseData {
  id!: string;
  tenantId!: string;
  name!: string;
  buildingCode?: string | null;
  gender!: Gender;
  description?: string | null;
  totalRooms!: number;
  totalCapacity!: number;
  totalOccupancy!: number;
  rooms?: DormRoomResponseData[];
}

// =============================================================================
// HALAQAH & TAHFIZ DTOs
// =============================================================================

export class CreateHalaqahGroupDto {
  name!: string;
  ustazEmployeeId!: string;
  targetJuz?: number;
  schedule?: string;
}

export class AddHalaqahMemberDto {
  studentId!: string;
}

export class RecordTahfizEntryDto {
  studentId!: string;
  musyrifId!: string;
  halaqahGroupId?: string;
  recordType!: TahfizRecordType;
  surahNumber!: number;
  surahName!: string;
  ayatStart!: number;
  ayatEnd!: number;
  juz!: number;
  fluencyRating!: TahfizFluencyRating;
  tajwidRating?: string;
  notes?: string;
  recordedAt?: string;
}

export class TahfizRecordResponseData {
  id!: string;
  tenantId!: string;
  studentId!: string;
  studentName!: string;
  studentNis!: string;
  musyrifId!: string;
  musyrifName!: string;
  halaqahGroupId?: string | null;
  halaqahGroupName?: string | null;
  recordType!: TahfizRecordType;
  surahNumber!: number;
  surahName!: string;
  ayatStart!: number;
  ayatEnd!: number;
  juz!: number;
  fluencyRating!: TahfizFluencyRating;
  tajwidRating?: string | null;
  notes?: string | null;
  recordedAt!: string;
}

export class HalaqahGroupResponseData {
  id!: string;
  tenantId!: string;
  name!: string;
  ustazEmployeeId!: string;
  ustazName!: string;
  targetJuz!: number;
  schedule?: string | null;
  memberCount!: number;
  members?: Array<{
    id: string;
    studentId: string;
    studentName: string;
    studentNis: string;
    joinedAt: string;
  }>;
  createdAt!: string;
}

export class TahfizStudentProgressSummaryDto {
  studentId!: string;
  studentName!: string;
  studentNis!: string;
  totalJuzCompleted!: number;
  totalVersesMemorized!: number;
  latestSurahName?: string | null;
  latestAyatEnd?: number | null;
  latestJuz?: number | null;
  ziyadahCount!: number;
  murojaahCount!: number;
  lastRecordDate?: string | null;
}

// =============================================================================
// PESANTREN PERMIT (PERIZINAN KELUAR / PULANG ASRAMA) DTOs
// =============================================================================

export class CreatePesantrenPermitDto {
  studentId!: string;
  permitType!: PesantrenPermitType;
  reason!: string;
  pickupPersonName!: string;
  pickupPersonRelation!: string;
  pickupPersonPhone!: string;
  expectedDeparture!: string;
  expectedReturn!: string;
  notes?: string;
}

export class ApprovePesantrenPermitDto {
  approvalStage!: 'MUSYRIF' | 'KEASRAMAAN';
  status!: 'APPROVED' | 'REJECTED';
  approverEmployeeId!: string;
  notes?: string;
}

export class SecurityGateCheckDto {
  securityGateToken!: string;
  action!: 'CHECK_OUT' | 'CHECK_IN';
  checkedByEmployeeId!: string;
  notes?: string;
}

export class PesantrenPermitResponseData {
  id!: string;
  tenantId!: string;
  studentId!: string;
  studentName!: string;
  studentNis!: string;
  permitType!: PesantrenPermitType;
  reason!: string;
  pickupPersonName!: string;
  pickupPersonRelation!: string;
  pickupPersonPhone!: string;
  expectedDeparture!: string;
  expectedReturn!: string;
  actualDeparture?: string | null;
  actualReturn?: string | null;
  securityGateToken!: string;
  status!: PesantrenPermitStatus;
  approvedByMusyrifId?: string | null;
  approvedByMusyrifName?: string | null;
  approvedByKeasramaanId?: string | null;
  approvedByKeasramaanName?: string | null;
  notes?: string | null;
  createdAt!: string;
  updatedAt!: string;
}
