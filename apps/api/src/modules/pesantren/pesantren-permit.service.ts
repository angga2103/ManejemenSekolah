import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  CreatePesantrenPermitDto,
  ApprovePesantrenPermitDto,
  SecurityGateCheckDto,
  PesantrenPermitResponseData,
} from '@edusaas/api-contracts';
import {
  PesantrenPermitType,
  PesantrenPermitStatus,
  NotificationChannel,
} from '@edusaas/shared-types';
import * as crypto from 'crypto';

@Injectable()
export class PesantrenPermitService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async createPermit(tenantId: string, dto: CreatePesantrenPermitDto): Promise<PesantrenPermitResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
      include: {
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException('Data santri tidak ditemukan');
    }

    const expDep = new Date(dto.expectedDeparture);
    const expRet = new Date(dto.expectedReturn);

    if (isNaN(expDep.getTime()) || isNaN(expRet.getTime())) {
      throw new BadRequestException('Format tanggal keberangkatan atau kepulangan tidak valid');
    }

    if (expRet <= expDep) {
      throw new BadRequestException('Waktu perkiraan kembali harus lebih besar dari waktu keberangkatan');
    }

    // Check if student already has an active permit outside or pending
    const existingActive = await this.prisma.pesantrenPermit.findFirst({
      where: {
        tenantId,
        studentId: dto.studentId,
        status: {
          in: [
            PesantrenPermitStatus.PENDING_APPROVAL,
            PesantrenPermitStatus.APPROVED_BY_MUSYRIF,
            PesantrenPermitStatus.APPROVED_BY_KEASRAMAAN,
            PesantrenPermitStatus.ACTIVE_OUTSIDE,
          ],
        },
      },
    });

    if (existingActive) {
      throw new BadRequestException(
        `Santri masih memiliki izin aktif dengan status [${existingActive.status}]. Selesaikan izin sebelumnya terlebih dahulu.`
      );
    }

    // Generate unique verification token for gate QR
    const datePrefix = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randSuffix = crypto.randomBytes(3).toString('hex').toUpperCase();
    const securityGateToken = `GATE-${datePrefix}-${randSuffix}`;

    const permit = await this.prisma.pesantrenPermit.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        permitType: dto.permitType,
        reason: dto.reason,
        pickupPersonName: dto.pickupPersonName,
        pickupPersonRelation: dto.pickupPersonRelation,
        pickupPersonPhone: dto.pickupPersonPhone,
        expectedDeparture: expDep,
        expectedReturn: expRet,
        securityGateToken,
        status: PesantrenPermitStatus.PENDING_APPROVAL,
        notes: dto.notes,
      },
      include: {
        student: true,
        approvedByMusyrif: true,
        approvedByKeasramaan: true,
      },
    });

    return this.mapPermitResponse(permit);
  }

  async approvePermit(
    tenantId: string,
    permitId: string,
    dto: ApprovePesantrenPermitDto
  ): Promise<PesantrenPermitResponseData> {
    const permit = await this.prisma.pesantrenPermit.findFirst({
      where: { id: permitId, tenantId },
      include: {
        student: {
          include: {
            guardians: {
              include: {
                guardian: true,
              },
            },
          },
        },
      },
    });

    if (!permit) {
      throw new NotFoundException('Data perizinan santri tidak ditemukan');
    }

    if (
      permit.status === PesantrenPermitStatus.REJECTED ||
      permit.status === PesantrenPermitStatus.RETURNED ||
      permit.status === PesantrenPermitStatus.OVERDUE
    ) {
      throw new BadRequestException(`Status izin tidak dapat diubah karena telah berstatus ${permit.status}`);
    }

    const approver = await this.prisma.employee.findFirst({
      where: { id: dto.approverEmployeeId, tenantId },
    });
    if (!approver) {
      throw new NotFoundException('Data pegawai/petugas approver tidak ditemukan');
    }

    let newStatus: PesantrenPermitStatus;
    const updateData: any = {};

    if (dto.approvalStage === 'MUSYRIF') {
      if (dto.status === 'REJECTED') {
        newStatus = PesantrenPermitStatus.REJECTED;
      } else {
        newStatus = PesantrenPermitStatus.APPROVED_BY_MUSYRIF;
      }
      updateData.approvedByMusyrifId = dto.approverEmployeeId;
    } else {
      // KEASRAMAAN
      if (dto.status === 'REJECTED') {
        newStatus = PesantrenPermitStatus.REJECTED;
      } else {
        newStatus = PesantrenPermitStatus.APPROVED_BY_KEASRAMAAN;
      }
      updateData.approvedByKeasramaanId = dto.approverEmployeeId;
    }

    updateData.status = newStatus;
    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    const updated = await this.prisma.pesantrenPermit.update({
      where: { id: permitId },
      data: updateData,
      include: {
        student: true,
        approvedByMusyrif: true,
        approvedByKeasramaan: true,
      },
    });

    // Notify guardian if approved by Keasramaan or rejected
    try {
      const primaryGuardian = permit.student?.guardians?.[0]?.guardian;
      if (primaryGuardian?.userId) {
        await this.notificationsService.sendNotification(tenantId, {
          userId: primaryGuardian.userId,
          title: `Update Izin Santri: ${permit.student.fullName}`,
          body:
            newStatus === PesantrenPermitStatus.APPROVED_BY_KEASRAMAAN
              ? `Izin ${permit.permitType} telah DISETUJUI KEASRAMAAN. Kode Gerbang: ${permit.securityGateToken}`
              : `Status perizinan santri diperbarui menjadi: ${newStatus}`,
          channel: NotificationChannel.IN_APP,
          metadata: { permitId, token: permit.securityGateToken, status: newStatus },
        });
      }
    } catch {
      // Notifications non-blocking
    }

    return this.mapPermitResponse(updated);
  }

  async securityGateCheck(tenantId: string, dto: SecurityGateCheckDto): Promise<PesantrenPermitResponseData> {
    const permit = await this.prisma.pesantrenPermit.findFirst({
      where: {
        securityGateToken: dto.securityGateToken.trim().toUpperCase(),
        tenantId,
      },
      include: {
        student: {
          include: {
            guardians: {
              include: {
                guardian: true,
              },
            },
          },
        },
        approvedByMusyrif: true,
        approvedByKeasramaan: true,
      },
    });

    if (!permit) {
      throw new NotFoundException('Token izin gerbang tidak ditemukan atau tidak valid');
    }

    const now = new Date();
    const updateData: any = {};
    let targetStatus: PesantrenPermitStatus;

    if (dto.action === 'CHECK_OUT') {
      if (permit.status !== PesantrenPermitStatus.APPROVED_BY_KEASRAMAAN) {
        throw new BadRequestException(
          `Santri belum dapat keluar gerbang. Status izin harus APPROVED_BY_KEASRAMAAN (Status saat ini: ${permit.status})`
        );
      }

      targetStatus = PesantrenPermitStatus.ACTIVE_OUTSIDE;
      updateData.actualDeparture = now;
      updateData.status = targetStatus;
    } else {
      // CHECK_IN (Kembali ke Pesantren)
      if (permit.status !== PesantrenPermitStatus.ACTIVE_OUTSIDE) {
        throw new BadRequestException(
          `Santri tidak sedang dalam status di luar kompleks (Status saat ini: ${permit.status})`
        );
      }

      updateData.actualReturn = now;
      if (now > permit.expectedReturn) {
        targetStatus = PesantrenPermitStatus.OVERDUE;
      } else {
        targetStatus = PesantrenPermitStatus.RETURNED;
      }
      updateData.status = targetStatus;
    }

    if (dto.notes) {
      updateData.notes = dto.notes;
    }

    const updated = await this.prisma.pesantrenPermit.update({
      where: { id: permit.id },
      data: updateData,
      include: {
        student: true,
        approvedByMusyrif: true,
        approvedByKeasramaan: true,
      },
    });

    // Notify guardian of gate checkout / checkin
    try {
      const primaryGuardian = permit.student?.guardians?.[0]?.guardian;
      if (primaryGuardian?.userId) {
        const actionText =
          dto.action === 'CHECK_OUT'
            ? `telah meninggalkan kompleks pesantren dijemput oleh ${permit.pickupPersonName} (${permit.pickupPersonRelation})`
            : targetStatus === PesantrenPermitStatus.OVERDUE
            ? `telah kembali ke pesantren (TERLAMBAT dari batas waktu ${permit.expectedReturn.toISOString()})`
            : `telah kembali ke pesantren dengan selamat tepat waktu`;

        await this.notificationsService.sendNotification(tenantId, {
          userId: primaryGuardian.userId,
          title: `Laporan Gerbang: ${permit.student.fullName}`,
          body: `Santri ${permit.student.fullName} ${actionText}.`,
          channel: NotificationChannel.IN_APP,
          metadata: { permitId: permit.id, action: dto.action, status: targetStatus },
        });
      }
    } catch {
      // Non-blocking
    }

    return this.mapPermitResponse(updated);
  }

  async listPermits(
    tenantId: string,
    filters: {
      studentId?: string;
      status?: PesantrenPermitStatus;
      permitType?: PesantrenPermitType;
    }
  ): Promise<PesantrenPermitResponseData[]> {
    const permits = await this.prisma.pesantrenPermit.findMany({
      where: {
        tenantId,
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.permitType ? { permitType: filters.permitType } : {}),
      },
      include: {
        student: true,
        approvedByMusyrif: true,
        approvedByKeasramaan: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    return permits.map((p) => this.mapPermitResponse(p));
  }

  async getPermitByToken(tenantId: string, token: string): Promise<PesantrenPermitResponseData> {
    const permit = await this.prisma.pesantrenPermit.findFirst({
      where: {
        securityGateToken: token.trim().toUpperCase(),
        tenantId,
      },
      include: {
        student: true,
        approvedByMusyrif: true,
        approvedByKeasramaan: true,
      },
    });

    if (!permit) {
      throw new NotFoundException('Token izin gerbang tidak ditemukan');
    }

    return this.mapPermitResponse(permit);
  }

  private mapPermitResponse(p: any): PesantrenPermitResponseData {
    return {
      id: p.id,
      tenantId: p.tenantId,
      studentId: p.studentId,
      studentName: p.student?.fullName || '',
      studentNis: p.student?.nis || '',
      permitType: p.permitType as PesantrenPermitType,
      reason: p.reason,
      pickupPersonName: p.pickupPersonName,
      pickupPersonRelation: p.pickupPersonRelation,
      pickupPersonPhone: p.pickupPersonPhone,
      expectedDeparture: p.expectedDeparture.toISOString(),
      expectedReturn: p.expectedReturn.toISOString(),
      actualDeparture: p.actualDeparture ? p.actualDeparture.toISOString() : null,
      actualReturn: p.actualReturn ? p.actualReturn.toISOString() : null,
      securityGateToken: p.securityGateToken,
      status: p.status as PesantrenPermitStatus,
      approvedByMusyrifId: p.approvedByMusyrifId,
      approvedByMusyrifName: p.approvedByMusyrif?.fullName || null,
      approvedByKeasramaanId: p.approvedByKeasramaanId,
      approvedByKeasramaanName: p.approvedByKeasramaan?.fullName || null,
      notes: p.notes,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }
}
