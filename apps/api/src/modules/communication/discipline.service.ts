import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  RecordViolationDto,
  StudentDisciplineSummaryDto,
  ViolationResponseData,
  RecordAchievementDto,
  AchievementResponseData,
} from '@edusaas/api-contracts';
import { SanctionLetterType, NotificationChannel } from '@edusaas/shared-types';

@Injectable()
export class DisciplineService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  // ===========================================================================
  // VIOLATIONS & DISCIPLINE
  // ===========================================================================

  async recordViolation(tenantId: string, dto: RecordViolationDto): Promise<ViolationResponseData> {
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

    const employee = await this.prisma.employee.findFirst({
      where: { id: dto.recordedByEmployeeId, tenantId },
    });

    if (!employee) {
      throw new NotFoundException('Data pegawai/guru pencatat pelanggaran tidak ditemukan');
    }

    if (dto.points < 0) {
      throw new BadRequestException('Poin pelanggaran tidak boleh negatif');
    }

    const violation = await this.prisma.studentViolation.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        recordedByEmployeeId: dto.recordedByEmployeeId,
        violationDate: new Date(dto.violationDate),
        title: dto.title,
        points: dto.points,
        sanction: dto.sanction,
        status: dto.status || 'RECORDED',
      },
      include: {
        student: true,
        recordedBy: true,
      },
    });

    // Calculate new total points
    const summary = await this.getStudentDisciplineSummary(tenantId, dto.studentId);

    // Notify guardian
    try {
      const primaryGuardian = student.guardians?.[0]?.guardian;
      if (primaryGuardian?.userId) {
        const warningNotice =
          summary.sanctionLetter !== SanctionLetterType.NONE
            ? ` Perhatian: Akumulasi poin santri telah mencapai status [${summary.sanctionLetter}].`
            : '';

        await this.notificationsService.sendNotification(tenantId, {
          userId: primaryGuardian.userId,
          title: `Catatan Tata Tertib: ${student.fullName}`,
          body: `Santri tercatat melakukan pelanggaran: "${dto.title}" (+${dto.points} poin). Total poin aktif: ${summary.totalPoints}.${warningNotice}`,
          channel: NotificationChannel.IN_APP,
          metadata: {
            violationId: violation.id,
            totalPoints: summary.totalPoints,
            sanctionLetter: summary.sanctionLetter,
          },
        });
      }
    } catch {
      // Non-blocking notification
    }

    return this.mapViolationResponse(violation);
  }

  async listViolations(
    tenantId: string,
    filters: {
      studentId?: string;
      fromDate?: string;
      toDate?: string;
    }
  ): Promise<ViolationResponseData[]> {
    const violations = await this.prisma.studentViolation.findMany({
      where: {
        tenantId,
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.fromDate || filters.toDate
          ? {
              violationDate: {
                ...(filters.fromDate ? { gte: new Date(filters.fromDate) } : {}),
                ...(filters.toDate ? { lte: new Date(filters.toDate) } : {}),
              },
            }
          : {}),
      },
      include: {
        student: true,
        recordedBy: true,
      },
      orderBy: { violationDate: 'desc' },
      take: 100,
    });

    return violations.map((v) => this.mapViolationResponse(v));
  }

  async getStudentDisciplineSummary(
    tenantId: string,
    studentId: string
  ): Promise<StudentDisciplineSummaryDto> {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
    });

    if (!student) {
      throw new NotFoundException('Data santri tidak ditemukan');
    }

    const violations = await this.prisma.studentViolation.findMany({
      where: { tenantId, studentId },
      orderBy: { violationDate: 'desc' },
    });

    const totalPoints = violations.reduce((acc, v) => acc + v.points, 0);

    let sanctionLetter = SanctionLetterType.NONE;
    if (totalPoints >= 75) {
      sanctionLetter = SanctionLetterType.SP3_CALL_PARENT;
    } else if (totalPoints >= 50) {
      sanctionLetter = SanctionLetterType.SP2;
    } else if (totalPoints >= 25) {
      sanctionLetter = SanctionLetterType.SP1;
    }

    return {
      studentId: student.id,
      studentName: student.fullName,
      studentNis: student.nis,
      totalPoints,
      sanctionLetter,
      violationCount: violations.length,
      latestViolationDate: violations[0] ? violations[0].violationDate.toISOString() : null,
    };
  }

  // ===========================================================================
  // ACHIEVEMENTS
  // ===========================================================================

  async recordAchievement(
    tenantId: string,
    dto: RecordAchievementDto
  ): Promise<AchievementResponseData> {
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

    const achievement = await this.prisma.studentAchievement.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        title: dto.title,
        level: dto.level,
        achievementDate: new Date(dto.achievementDate),
        points: dto.points ?? 10,
        certificateUrl: dto.certificateUrl,
      },
      include: {
        student: true,
      },
    });

    // Notify guardian of proud achievement
    try {
      const primaryGuardian = student.guardians?.[0]?.guardian;
      if (primaryGuardian?.userId) {
        await this.notificationsService.sendNotification(tenantId, {
          userId: primaryGuardian.userId,
          title: `Selamat! Prestasi Santri: ${student.fullName}`,
          body: `Alhamdulillah, ananda ${student.fullName} meraih prestasi: "${dto.title}" tingkat ${dto.level}.`,
          channel: NotificationChannel.IN_APP,
          metadata: { achievementId: achievement.id, level: dto.level },
        });
      }
    } catch {
      // Non-blocking
    }

    return {
      id: achievement.id,
      tenantId: achievement.tenantId,
      studentId: achievement.studentId,
      studentName: achievement.student.fullName,
      studentNis: achievement.student.nis,
      title: achievement.title,
      level: achievement.level,
      achievementDate: achievement.achievementDate.toISOString(),
      points: achievement.points,
      certificateUrl: achievement.certificateUrl,
      createdAt: achievement.createdAt.toISOString(),
    };
  }

  async listAchievements(
    tenantId: string,
    filters: {
      studentId?: string;
      level?: string;
    }
  ): Promise<AchievementResponseData[]> {
    const achievements = await this.prisma.studentAchievement.findMany({
      where: {
        tenantId,
        ...(filters.studentId ? { studentId: filters.studentId } : {}),
        ...(filters.level ? { level: filters.level } : {}),
      },
      include: {
        student: true,
      },
      orderBy: { achievementDate: 'desc' },
      take: 100,
    });

    return achievements.map((a) => ({
      id: a.id,
      tenantId: a.tenantId,
      studentId: a.studentId,
      studentName: a.student.fullName,
      studentNis: a.student.nis,
      title: a.title,
      level: a.level,
      achievementDate: a.achievementDate.toISOString(),
      points: a.points,
      certificateUrl: a.certificateUrl,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  private mapViolationResponse(v: any): ViolationResponseData {
    return {
      id: v.id,
      tenantId: v.tenantId,
      studentId: v.studentId,
      studentName: v.student?.fullName || '',
      studentNis: v.student?.nis || '',
      recordedByEmployeeId: v.recordedByEmployeeId,
      recordedByName: v.recordedBy?.fullName || '',
      violationDate: v.violationDate.toISOString(),
      title: v.title,
      points: v.points,
      sanction: v.sanction,
      status: v.status,
      createdAt: v.createdAt.toISOString(),
    };
  }
}
