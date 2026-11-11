import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  LeaveStatus,
  AttendanceStatus,
  AttendanceType,
  AttendanceMethod,
} from '@edusaas/shared-types';
import {
  CreateLeaveRequestDto,
  ApproveLeaveRequestDto,
  LeaveRequestResponseData,
} from '@edusaas/api-contracts';

@Injectable()
export class LeaveRequestsService {
  private readonly logger = new Logger(LeaveRequestsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
    private notificationsService: NotificationsService,
  ) {}

  /**
   * Submit a new student leave/sick permission request
   */
  async createLeaveRequest(
    tenantId: string,
    dto: CreateLeaveRequestDto,
  ): Promise<LeaveRequestResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId, deletedAt: null },
      include: {
        classStudents: { include: { classGroup: true } },
      },
    });

    if (!student) {
      throw new NotFoundException('Data santri tidak ditemukan');
    }

    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    if (endDate < startDate) {
      throw new BadRequestException('Tanggal selesai tidak boleh sebelum tanggal mulai');
    }

    const created = await this.prisma.leaveRequest.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        reason: dto.reason,
        startDate,
        endDate,
        status: LeaveStatus.PENDING,
      },
    });

    return this.mapToResponse(created, student);
  }

  /**
   * Approve or reject a student leave request with automatic attendance synchronization
   */
  async approveLeaveRequest(
    tenantId: string,
    approverUserId: string,
    approverEmployeeId: string | null,
    leaveRequestId: string,
    dto: ApproveLeaveRequestDto,
  ): Promise<LeaveRequestResponseData> {
    const existing = await this.prisma.leaveRequest.findFirst({
      where: { id: leaveRequestId, tenantId },
      include: {
        student: {
          include: {
            classStudents: { include: { classGroup: true } },
          },
        },
        approvedBy: true,
      },
    });

    if (!existing) {
      throw new NotFoundException('Pengajuan izin tidak ditemukan');
    }

    let employeeId = approverEmployeeId;
    if (!employeeId) {
      const emp = await this.prisma.employee.findFirst({
        where: { tenantId, userId: approverUserId },
      });
      if (emp) employeeId = emp.id;
    }

    const updated = await this.prisma.leaveRequest.update({
      where: { id: leaveRequestId },
      data: {
        status: dto.status,
        approvedByEmployeeId: employeeId,
      },
      include: {
        student: {
          include: {
            classStudents: { include: { classGroup: true } },
          },
        },
        approvedBy: true,
      },
    });

    // If APPROVED: automatically generate or update Attendance records for all dates in range
    if (dto.status === LeaveStatus.APPROVED) {
      const isSick = existing.reason.toLowerCase().includes('sakit');
      const attendanceStatus = isSick ? AttendanceStatus.SICK : AttendanceStatus.PERMISSION;

      const currentDate = new Date(existing.startDate);
      const targetEndDate = new Date(existing.endDate);

      while (currentDate <= targetEndDate) {
        const loopDate = new Date(currentDate);
        loopDate.setHours(0, 0, 0, 0);

        await this.prisma.attendance.upsert({
          where: {
            tenantId_studentId_recordedDate_type: {
              tenantId,
              studentId: existing.studentId,
              recordedDate: loopDate,
              type: AttendanceType.CLASS,
            },
          },
          create: {
            tenantId,
            studentId: existing.studentId,
            type: AttendanceType.CLASS,
            status: attendanceStatus,
            method: AttendanceMethod.MANUAL,
            recordedDate: loopDate,
            notes: `Izin resmi: ${existing.reason}`,
          },
          update: {
            status: attendanceStatus,
            notes: `Izin resmi: ${existing.reason}`,
          },
        });

        currentDate.setDate(currentDate.getDate() + 1);
      }
    }

    // Audit Log
    await this.auditService.record({
      tenantId,
      userId: approverUserId,
      action: dto.status === LeaveStatus.APPROVED ? 'APPROVE_LEAVE' : 'REJECT_LEAVE',
      resource: 'LeaveRequest',
      resourceId: leaveRequestId,
      newValues: { status: dto.status, notes: dto.notes },
    });

    // Notify Guardians
    this.notificationsService.notifyLeaveRequestStatus(
      tenantId,
      {
        studentId: existing.studentId,
        reason: existing.reason,
        startDate: existing.startDate,
        endDate: existing.endDate,
        status: dto.status,
      },
      ((existing as any).student?.fullName || ""),
      (updated as any).approvedBy?.fullName,
    );

    return this.mapToResponse(updated, (updated as any).student, (updated as any).approvedBy);
  }

  /**
   * List leave requests with filters
   */
  async listLeaveRequests(
    tenantId: string,
    filter: { studentId?: string; status?: LeaveStatus; page?: number; limit?: number } = {},
  ): Promise<{ data: LeaveRequestResponseData[]; meta: { total: number; page: number; limit: number } }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = { tenantId };
    if (filter.studentId) where.studentId = filter.studentId;
    if (filter.status) where.status = filter.status;

    const [records, total] = await Promise.all([
      this.prisma.leaveRequest.findMany({
        where,
        include: {
          student: {
            include: {
              classStudents: { include: { classGroup: true } },
            },
          },
          approvedBy: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.leaveRequest.count({ where }),
    ]);

    const data = records.map((r: any) => this.mapToResponse(r, r.student, r.approvedBy));

    return {
      data,
      meta: { total, page, limit },
    };
  }

  private mapToResponse(record: any, student?: any, approvedBy?: any): LeaveRequestResponseData {
    const activeClass = student?.classStudents?.[0]?.classGroup?.name;

    return {
      id: record.id,
      tenantId: record.tenantId,
      studentId: record.studentId,
      studentName: student?.fullName || undefined,
      studentNis: student?.nis || undefined,
      classGroupName: activeClass,
      reason: record.reason,
      startDate: record.startDate instanceof Date ? record.startDate.toISOString().split('T')[0] : record.startDate,
      endDate: record.endDate instanceof Date ? record.endDate.toISOString().split('T')[0] : record.endDate,
      status: record.status as LeaveStatus,
      approvedByEmployeeId: record.approvedByEmployeeId,
      approvedByEmployeeName: approvedBy?.fullName || undefined,
      createdAt: record.createdAt instanceof Date ? record.createdAt.toISOString() : record.createdAt,
      updatedAt: record.updatedAt instanceof Date ? record.updatedAt.toISOString() : record.updatedAt,
    };
  }
}
