import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  AttendanceType,
  AttendanceStatus,
  AttendanceMethod,
  LeaveStatus,
  SystemRoleSlug,
} from '@edusaas/shared-types';
import {
  GenerateDynamicQrDto,
  DynamicQrPayload,
  VerifyDynamicQrDto,
  RecordAttendanceDto,
  ManualClassRollCallDto,
  AttendanceCorrectionDto,
  AttendanceFilterDto,
  AttendanceResponseData,
  AttendanceSummaryDto,
  OfflineSyncBatchRequestDto,
  OfflineSyncBatchResultDto,
  OfflineSyncBatchFailure,
} from '@edusaas/api-contracts';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);
  private readonly qrSecret =
    process.env.QR_HMAC_SECRET ||
    (process.env.NODE_ENV === 'production'
      ? (() => {
          throw new Error('CRITICAL CONFIGURATION ERROR: QR_HMAC_SECRET must be configured in production!');
        })()
      : 'edusaas_dynamic_qr_secret_key_2026');

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  // ---------------------------------------------------------------------------
  // 1. DYNAMIC QR GENERATOR & VALIDATOR
  // ---------------------------------------------------------------------------

  /**
   * Generates a tamper-proof cryptographically signed QR code payload that expires
   * within a short window (default: 60s) to prevent screenshot sharing.
   */
  generateDynamicQr(tenantId: string, dto: GenerateDynamicQrDto): { token: string; expiresAt: number; validitySeconds: number } {
    const validitySeconds = dto.validitySeconds || 60;
    const now = Date.now();
    const expiresAt = now + validitySeconds * 1000;
    const nonce = crypto.randomBytes(12).toString('hex');

    const unsignedPayload = {
      tenantId,
      type: dto.type,
      nonce,
      createdAt: now,
      expiresAt,
      metadata: {
        institutionId: dto.institutionId,
        classGroupId: dto.classGroupId,
        dormitoryId: dto.dormitoryId,
      },
    };

    const payloadJson = JSON.stringify(unsignedPayload);
    const signature = crypto
      .createHmac('sha256', this.qrSecret)
      .update(payloadJson)
      .digest('hex');

    const signedData: DynamicQrPayload = {
      ...unsignedPayload,
      signature,
    };

    const token = Buffer.from(JSON.stringify(signedData)).toString('base64url');

    return {
      token,
      expiresAt,
      validitySeconds,
    };
  }

  /**
   * Verifies a dynamic QR code and records student attendance
   */
  async verifyAndRecordDynamicQr(
    tenantId: string,
    dto: VerifyDynamicQrDto,
    currentUser?: any,
  ): Promise<AttendanceResponseData> {
    if (currentUser) {
      const roleList = Array.isArray(currentUser.roles) ? currentUser.roles : [];
      const isStudent = roleList.some(
        (r: any) =>
          (typeof r === 'string' ? r : r.slug) === SystemRoleSlug.STUDENT ||
          (typeof r === 'string' ? r : r.slug) === 'student' ||
          (typeof r === 'string' ? r : r.slug) === 'santri',
      );

      if (isStudent) {
        const student = await this.prisma.student.findFirst({
          where: { userId: currentUser.id, tenantId, deletedAt: null },
        });

        if (!student || student.id !== dto.studentId) {
          throw new ForbiddenException(
            'Santri/Siswa hanya dapat merekam presensi untuk akun miliknya sendiri (anti-titip presensi)',
          );
        }
      }
    }
    let payload: DynamicQrPayload;
    try {
      const decodedStr = Buffer.from(dto.token, 'base64url').toString('utf8');
      payload = JSON.parse(decodedStr);
    } catch {
      throw new BadRequestException('Format QR code tidak valid atau rusak');
    }

    // 1. Verify tenant match
    if (payload.tenantId !== tenantId) {
      throw new BadRequestException('QR code tidak sesuai dengan institusi Anda');
    }

    // 2. Verify signature
    const { signature, ...unsignedPayload } = payload;
    const expectedSignature = crypto
      .createHmac('sha256', this.qrSecret)
      .update(JSON.stringify(unsignedPayload))
      .digest('hex');

    if (signature !== expectedSignature) {
      throw new BadRequestException('Tanda tangan kriptografis QR code tidak valid (kemungkinan manipulasi)');
    }

    // 3. Check expiration
    if (Date.now() > payload.expiresAt) {
      throw new BadRequestException('QR code telah kedaluwarsa. Silakan scan QR code terbaru');
    }

    // 4. Record attendance
    return this.recordAttendance(tenantId, {
      studentId: dto.studentId,
      type: payload.type,
      method: AttendanceMethod.QR_DYNAMIC,
      deviceId: dto.deviceId,
      latitude: dto.latitude,
      longitude: dto.longitude,
    });
  }

  // ---------------------------------------------------------------------------
  // 2. ATTENDANCE RECORDING & LATENESS CALCULATION
  // ---------------------------------------------------------------------------

  /**
   * Records attendance with automatic lateness detection, leave checks, and guardian notification
   */
  async recordAttendance(
    tenantId: string,
    dto: RecordAttendanceDto,
  ): Promise<AttendanceResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId, deletedAt: null },
      include: {
        classStudents: { include: { classGroup: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Data santri tidak ditemukan pada tenant ini');
    }

    const type = dto.type || AttendanceType.CLASS;
    const checkInTime = dto.checkInTime ? new Date(dto.checkInTime) : new Date();
    const recordedDate = dto.recordedDate ? new Date(dto.recordedDate) : new Date(checkInTime);
    recordedDate.setHours(0, 0, 0, 0);

    // 1. Check for duplicate on the same date and type
    const existing = await this.prisma.attendance.findUnique({
      where: {
        tenantId_studentId_recordedDate_type: {
          tenantId,
          studentId: dto.studentId,
          recordedDate,
          type,
        },
      },
    });

    // If already exists and checking out
    if (existing) {
      if (dto.checkOutTime) {
        const updated = await this.prisma.attendance.update({
          where: { id: existing.id },
          data: {
            checkOutTime: new Date(dto.checkOutTime),
            notes: dto.notes || existing.notes,
          },
        });
        return this.mapToResponse(updated, student);
      }
      // Return existing attendance record if already checked in
      return this.mapToResponse(existing, student);
    }

    // 2. Check if student has an APPROVED leave request for this date
    const approvedLeave = await this.prisma.leaveRequest.findFirst({
      where: {
        tenantId,
        studentId: dto.studentId,
        status: LeaveStatus.APPROVED,
        startDate: { lte: recordedDate },
        endDate: { gte: recordedDate },
      },
    });

    let status = dto.status || AttendanceStatus.PRESENT;

    if (approvedLeave) {
      // Prioritize reason from approved leave
      const reasonLower = approvedLeave.reason.toLowerCase();
      status = reasonLower.includes('sakit') ? AttendanceStatus.SICK : AttendanceStatus.PERMISSION;
    } else if (!dto.status && type === AttendanceType.CLASS) {
      // 3. Auto-calculate Lateness (Default Cutoff: 07:15:00 WIB)
      const hours = checkInTime.getHours();
      const minutes = checkInTime.getMinutes();
      if (hours > 7 || (hours === 7 && minutes > 15)) {
        status = AttendanceStatus.LATE;
      }
    }

    // 4. Create attendance record
    const created = await this.prisma.attendance.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        type,
        status,
        method: dto.method || AttendanceMethod.QR_DYNAMIC,
        recordedDate,
        checkInTime,
        checkOutTime: dto.checkOutTime ? new Date(dto.checkOutTime) : null,
        deviceId: dto.deviceId || null,
        latitude: dto.latitude || null,
        longitude: dto.longitude || null,
        notes: dto.notes || null,
      },
    });

    // 5. Trigger real-time notifications to guardians
    this.notificationsService.notifyStudentAttendance(tenantId, student.id, {
      type: created.type,
      status: created.status,
      recordedDate: created.recordedDate,
      checkInTime: created.checkInTime,
    });

    return this.mapToResponse(created, student);
  }

  // ---------------------------------------------------------------------------
  // 3. MANUAL CLASS ROLL CALL
  // ---------------------------------------------------------------------------

  /**
   * Batch manual roll call for an entire class roster
   */
  async recordManualRollCall(
    tenantId: string,
    recordedByUserId: string,
    dto: ManualClassRollCallDto,
  ): Promise<{ recordedCount: number; recordedDate: string }> {
    const classGroup = await this.prisma.classGroup.findFirst({
      where: { id: dto.classGroupId, tenantId },
    });

    if (!classGroup) {
      throw new NotFoundException('Rombel kelas tidak ditemukan');
    }

    const recordedDate = new Date(dto.recordedDate);
    recordedDate.setHours(0, 0, 0, 0);
    const type = dto.type || AttendanceType.CLASS;

    let count = 0;
    for (const item of dto.items) {
      await this.prisma.attendance.upsert({
        where: {
          tenantId_studentId_recordedDate_type: {
            tenantId,
            studentId: item.studentId,
            recordedDate,
            type,
          },
        },
        create: {
          tenantId,
          studentId: item.studentId,
          type,
          status: item.status,
          method: AttendanceMethod.MANUAL,
          recordedDate,
          checkInTime: item.status === AttendanceStatus.ABSENT ? null : new Date(),
          notes: item.notes || `Presensi manual rombel ${classGroup.name}`,
        },
        update: {
          status: item.status,
          notes: item.notes,
        },
      });
      count++;
    }

    await this.auditService.record({
      tenantId,
      userId: recordedByUserId,
      action: 'MANUAL_ROLL_CALL',
      resource: 'Attendance',
      resourceId: classGroup.id,
      newValues: { classGroupId: classGroup.id, count, recordedDate: dto.recordedDate },
    });

    return { recordedCount: count, recordedDate: dto.recordedDate };
  }

  // ---------------------------------------------------------------------------
  // 4. ATTENDANCE CORRECTIONS WITH AUDIT
  // ---------------------------------------------------------------------------

  /**
   * Corrects attendance record status with mandatory reason and immutable audit log
   */
  async correctAttendance(
    tenantId: string,
    modifiedByUserId: string,
    attendanceId: string,
    dto: AttendanceCorrectionDto,
  ): Promise<AttendanceResponseData> {
    const existing = await this.prisma.attendance.findFirst({
      where: { id: attendanceId, tenantId },
      include: { student: true },
    });

    if (!existing) {
      throw new NotFoundException('Data presensi tidak ditemukan');
    }

    const oldStatus = existing.status;
    const updated = await this.prisma.attendance.update({
      where: { id: attendanceId },
      data: {
        status: dto.newStatus,
        notes: dto.notes ? `${existing.notes || ''} [Koreksi: ${dto.notes}]` : existing.notes,
      },
    });

    await this.auditService.record({
      tenantId,
      userId: modifiedByUserId,
      action: 'CORRECTION',
      resource: 'Attendance',
      resourceId: attendanceId,
      oldValues: { status: oldStatus, notes: existing.notes },
      newValues: { status: dto.newStatus, notes: dto.notes },
    });

    return this.mapToResponse(updated, existing.student);
  }

  // ---------------------------------------------------------------------------
  // 5. OFFLINE SYNC BATCH ENGINE
  // ---------------------------------------------------------------------------

  /**
   * Processes a batch of attendance scans recorded offline on mobile devices
   */
  async processOfflineSyncBatch(
    tenantId: string,
    dto: OfflineSyncBatchRequestDto,
  ): Promise<OfflineSyncBatchResultDto> {
    let syncedCount = 0;
    let duplicateCount = 0;
    let failedCount = 0;
    const failures: OfflineSyncBatchFailure[] = [];

    for (const record of dto.records) {
      try {
        const student = await this.prisma.student.findFirst({
          where: { id: record.studentId, tenantId, deletedAt: null },
        });

        if (!student) {
          failedCount++;
          failures.push({
            clientRecordId: record.clientRecordId,
            studentId: record.studentId,
            reason: 'Santri tidak ditemukan pada tenant ini',
          });
          continue;
        }

        const recordedDate = new Date(record.recordedDate);
        recordedDate.setHours(0, 0, 0, 0);

        const existing = await this.prisma.attendance.findUnique({
          where: {
            tenantId_studentId_recordedDate_type: {
              tenantId,
              studentId: record.studentId,
              recordedDate,
              type: record.type,
            },
          },
        });

        if (existing) {
          duplicateCount++;
          continue;
        }

        await this.prisma.attendance.create({
          data: {
            tenantId,
            studentId: record.studentId,
            type: record.type,
            status: record.status,
            method: AttendanceMethod.OFFLINE_SYNC,
            recordedDate,
            checkInTime: record.checkInTime ? new Date(record.checkInTime) : new Date(),
            checkOutTime: record.checkOutTime ? new Date(record.checkOutTime) : null,
            deviceId: record.deviceId || dto.deviceId,
            latitude: record.latitude,
            longitude: record.longitude,
            notes: record.notes ? `${record.notes} (Sync Offline)` : 'Sync Offline',
          },
        });

        syncedCount++;
      } catch (err) {
        failedCount++;
        failures.push({
          clientRecordId: record.clientRecordId,
          studentId: record.studentId,
          reason: err.message || 'Gagal memproses data sinkronisasi',
        });
      }
    }

    this.logger.log(
      `[OFFLINE-SYNC] Device: ${dto.deviceId} | Synced: ${syncedCount} | Duplicates: ${duplicateCount} | Failed: ${failedCount}`,
    );

    return {
      syncedCount,
      duplicateCount,
      failedCount,
      failures,
    };
  }

  // ---------------------------------------------------------------------------
  // 6. DAILY & MONTHLY SUMMARY REPORTS
  // ---------------------------------------------------------------------------

  /**
   * Generates aggregated statistics for a specific date
   */
  async getDailySummary(
    tenantId: string,
    recordedDateStr: string,
    type: AttendanceType = AttendanceType.CLASS,
  ): Promise<AttendanceSummaryDto> {
    const recordedDate = new Date(recordedDateStr);
    recordedDate.setHours(0, 0, 0, 0);

    const [totalActiveStudents, records] = await Promise.all([
      this.prisma.student.count({
        where: { tenantId, status: 'ACTIVE', deletedAt: null },
      }),
      this.prisma.attendance.findMany({
        where: {
          tenantId,
          recordedDate,
          type,
        },
      }),
    ]);

    let presentCount = 0;
    let lateCount = 0;
    let sickCount = 0;
    let permissionCount = 0;
    let dispensationCount = 0;
    let absentCount = 0;

    for (const r of records) {
      switch (r.status) {
        case AttendanceStatus.PRESENT:
          presentCount++;
          break;
        case AttendanceStatus.LATE:
          lateCount++;
          break;
        case AttendanceStatus.SICK:
          sickCount++;
          break;
        case AttendanceStatus.PERMISSION:
          permissionCount++;
          break;
        case AttendanceStatus.DISPENSATION:
          dispensationCount++;
          break;
        case AttendanceStatus.ABSENT:
          absentCount++;
          break;
      }
    }

    const totalAttended = presentCount + lateCount + sickCount + permissionCount + dispensationCount;
    // Calculate unrecorded as absent if total recorded is less than active students
    if (records.length < totalActiveStudents) {
      absentCount += totalActiveStudents - records.length;
    }

    const attendanceRatePercentage =
      totalActiveStudents > 0
        ? Math.round(((presentCount + lateCount) / totalActiveStudents) * 100 * 10) / 10
        : 0;

    return {
      recordedDate: recordedDate.toISOString().split('T')[0],
      type,
      totalStudents: totalActiveStudents,
      presentCount,
      lateCount,
      sickCount,
      permissionCount,
      dispensationCount,
      absentCount,
      attendanceRatePercentage,
    };
  }

  /**
   * Paginated list of attendance records with search and filters
   */
  async listAttendance(
    tenantId: string,
    filter: AttendanceFilterDto = {},
  ): Promise<{ data: AttendanceResponseData[]; meta: { total: number; page: number; limit: number } }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };

    if (filter.studentId) where.studentId = filter.studentId;
    if (filter.type) where.type = filter.type;
    if (filter.status) where.status = filter.status;

    if (filter.recordedDate) {
      const d = new Date(filter.recordedDate);
      d.setHours(0, 0, 0, 0);
      where.recordedDate = d;
    } else if (filter.startDate || filter.endDate) {
      where.recordedDate = {};
      if (filter.startDate) {
        const s = new Date(filter.startDate);
        s.setHours(0, 0, 0, 0);
        where.recordedDate.gte = s;
      }
      if (filter.endDate) {
        const e = new Date(filter.endDate);
        e.setHours(23, 59, 59, 999);
        where.recordedDate.lte = e;
      }
    }

    if (filter.classGroupId) {
      where.student = {
        classStudents: { some: { classGroupId: filter.classGroupId, isActive: true } },
      };
    }

    const [records, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: {
          student: {
            include: {
              classStudents: { include: { classGroup: true } },
            },
          },
        },
        orderBy: [{ recordedDate: 'desc' }, { checkInTime: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
    ]);

    const data: AttendanceResponseData[] = records.map((r: any) => this.mapToResponse(r, r.student));

    return {
      data,
      meta: { total, page, limit },
    };
  }

  private mapToResponse(record: any, student?: any): AttendanceResponseData {
    const activeClass = student?.classStudents?.[0]?.classGroup?.name;

    return {
      id: record.id,
      tenantId: record.tenantId,
      studentId: record.studentId,
      studentName: student?.fullName || undefined,
      studentNis: student?.nis || undefined,
      classGroupName: activeClass,
      type: record.type as AttendanceType,
      status: record.status as AttendanceStatus,
      method: record.method as AttendanceMethod,
      recordedDate: record.recordedDate instanceof Date ? record.recordedDate.toISOString().split('T')[0] : record.recordedDate,
      checkInTime: record.checkInTime ? new Date(record.checkInTime).toISOString() : null,
      checkOutTime: record.checkOutTime ? new Date(record.checkOutTime).toISOString() : null,
      deviceId: record.deviceId,
      latitude: record.latitude,
      longitude: record.longitude,
      notes: record.notes,
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
    };
  }
}
