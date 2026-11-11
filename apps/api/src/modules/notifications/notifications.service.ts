import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  NotificationChannel,
  NotificationStatus,
} from '@edusaas/shared-types';
import {
  NotificationItemData,
  SendNotificationDto,
  RegisterDeviceTokenDto,
} from '@edusaas/api-contracts';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  // In-memory registry for device push tokens (FCM mock abstraction)
  private readonly deviceTokens = new Map<string, { token: string; platform: string; updatedAt: Date }>();

  constructor(private prisma: PrismaService) {}

  /**
   * Register or update mobile FCM push notification token
   */
  async registerDeviceToken(tenantId: string, userId: string, dto: RegisterDeviceTokenDto) {
    const key = `${tenantId}:${userId}`;
    this.deviceTokens.set(key, {
      token: dto.fcmToken,
      platform: dto.platform,
      updatedAt: new Date(),
    });

    this.logger.log(`[FCM-REGISTER] Registered push token for user ${userId} on platform ${dto.platform}`);
    return { success: true, message: 'Device token registered successfully' };
  }

  /**
   * Dispatch a notification across selected channels
   */
  async sendNotification(
    tenantId: string,
    dto: SendNotificationDto,
  ): Promise<NotificationItemData> {
    const channel = dto.channel || NotificationChannel.IN_APP;

    // 1. Simulate external push / WhatsApp gateway integration
    if (channel === NotificationChannel.PUSH) {
      const device = dto.userId ? this.deviceTokens.get(`${tenantId}:${dto.userId}`) : null;
      if (device) {
        this.logger.log(`[FCM-PUSH-SEND] Sending push to ${dto.userId} (Token: ${device.token.substring(0, 10)}...): "${dto.title}"`);
      } else {
        this.logger.log(`[FCM-PUSH-BROADCAST] Simulated push broadcast: "${dto.title}"`);
      }
    } else if (channel === NotificationChannel.WHATSAPP) {
      this.logger.log(`[WHATSAPP-GATEWAY] Dispatched WhatsApp message to recipient: "${dto.title} - ${dto.body}"`);
    }

    // 2. Persist notification log to database
    const record = await this.prisma.notificationLog.create({
      data: {
        tenantId,
        userId: dto.userId || null,
        title: dto.title,
        body: dto.body,
        channel,
        status: NotificationStatus.SENT,
        category: dto.category || 'SYSTEM',
        metadata: (dto.metadata as any) || undefined,
      },
    });

    return {
      id: record.id,
      tenantId: record.tenantId,
      userId: record.userId,
      title: record.title,
      body: record.body,
      channel: record.channel as NotificationChannel,
      status: record.status as NotificationStatus,
      category: record.category,
      metadata: record.metadata as Record<string, any>,
      readAt: record.readAt ? record.readAt.toISOString() : null,
      createdAt: record.createdAt.toISOString(),
    };
  }

  /**
   * Notify guardians regarding student attendance event
   */
  async notifyStudentAttendance(
    tenantId: string,
    studentId: string,
    attendance: {
      type: string;
      status: string;
      recordedDate: Date;
      checkInTime?: Date | null;
    },
  ) {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id: studentId },
        include: {
          guardians: {
            include: {
              guardian: {
                include: { user: true },
              },
            },
          },
        },
      });

      if (!student) return;

      const timeStr = attendance.checkInTime
        ? attendance.checkInTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        : 'Waktu Tidak Tercatat';

      const statusIndo =
        attendance.status === 'PRESENT'
          ? 'HADIR TEPAT WAKTU'
          : attendance.status === 'LATE'
            ? 'TERLAMBAT'
            : attendance.status === 'SICK'
              ? 'SAKIT'
              : attendance.status === 'PERMISSION'
                ? 'IZIN'
                : 'ALPA / TIDAK HADIR';

      const title = `Laporan Presensi: ${student.fullName} (${statusIndo})`;
      const body = `Santri ${student.fullName} (NIS: ${student.nis}) tercatat ${statusIndo} untuk kegiatan ${attendance.type} pada ${attendance.recordedDate.toISOString().split('T')[0]} pukul ${timeStr}.`;

      for (const link of student.guardians) {
        const guardianUserId = link.guardian.userId;

        // In-App Notification
        await this.sendNotification(tenantId, {
          userId: guardianUserId,
          title,
          body,
          channel: NotificationChannel.IN_APP,
          category: 'ATTENDANCE',
          metadata: {
            studentId,
            status: attendance.status,
            type: attendance.type,
            checkInTime: attendance.checkInTime?.toISOString(),
          },
        });

        // Push Notification if subscribed
        if (link.receivePush) {
          await this.sendNotification(tenantId, {
            userId: guardianUserId,
            title,
            body,
            channel: NotificationChannel.PUSH,
            category: 'ATTENDANCE',
          });
        }

        // WhatsApp Notification if subscribed
        if (link.receiveWhatsapp) {
          await this.sendNotification(tenantId, {
            userId: guardianUserId,
            title,
            body,
            channel: NotificationChannel.WHATSAPP,
            category: 'ATTENDANCE',
          });
        }
      }
    } catch (err) {
      this.logger.error(`Failed to dispatch attendance notification: ${err.message}`, err.stack);
    }
  }

  /**
   * Notify guardians about leave request approval or rejection
   */
  async notifyLeaveRequestStatus(
    tenantId: string,
    leaveRequest: {
      studentId: string;
      reason: string;
      startDate: Date;
      endDate: Date;
      status: string;
    },
    studentName: string,
    approverName?: string,
  ) {
    try {
      const student = await this.prisma.student.findUnique({
        where: { id: leaveRequest.studentId },
        include: {
          guardians: {
            include: {
              guardian: true,
            },
          },
        },
      });

      if (!student) return;

      const start = leaveRequest.startDate.toISOString().split('T')[0];
      const end = leaveRequest.endDate.toISOString().split('T')[0];
      const statusText = leaveRequest.status === 'APPROVED' ? 'DISETUJUI' : 'DITOLAK';

      const title = `Pengajuan Izin Santri ${statusText}`;
      const body = `Pengajuan permohonan izin untuk santri ${studentName} (${start} s.d ${end}) dengan alasan "${leaveRequest.reason}" telah ${statusText}${approverName ? ` oleh ${approverName}` : ''}.`;

      for (const link of student.guardians) {
        await this.sendNotification(tenantId, {
          userId: link.guardian.userId,
          title,
          body,
          channel: NotificationChannel.IN_APP,
          category: 'LEAVE_REQUEST',
        });
      }
    } catch (err) {
      this.logger.error(`Failed to dispatch leave request notification: ${err.message}`);
    }
  }

  /**
   * Get user in-app notifications
   */
  async getUserNotifications(
    tenantId: string,
    userId: string,
    page = 1,
    limit = 20,
  ): Promise<{ data: NotificationItemData[]; unreadCount: number }> {
    const skip = (Math.max(1, page) - 1) * Math.min(100, Math.max(1, limit));
    const take = Math.min(100, Math.max(1, limit));

    const [records, unreadCount] = await Promise.all([
      this.prisma.notificationLog.findMany({
        where: {
          tenantId,
          userId,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.notificationLog.count({
        where: {
          tenantId,
          userId,
          readAt: null,
        },
      }),
    ]);

    const data: NotificationItemData[] = records.map((r) => ({
      id: r.id,
      tenantId: r.tenantId,
      userId: r.userId,
      title: r.title,
      body: r.body,
      channel: r.channel as NotificationChannel,
      status: r.status as NotificationStatus,
      category: r.category,
      metadata: r.metadata as Record<string, any>,
      readAt: r.readAt ? r.readAt.toISOString() : null,
      createdAt: r.createdAt.toISOString(),
    }));

    return { data, unreadCount };
  }

  /**
   * Mark single notification as read
   */
  async markAsRead(tenantId: string, userId: string, notificationId: string) {
    const existing = await this.prisma.notificationLog.findFirst({
      where: { id: notificationId, tenantId, userId },
    });

    if (!existing) {
      throw new NotFoundException('Notifikasi tidak ditemukan');
    }

    const updated = await this.prisma.notificationLog.update({
      where: { id: notificationId },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    return { success: true, readAt: updated.readAt?.toISOString() };
  }

  /**
   * Mark all notifications for user as read
   */
  async markAllAsRead(tenantId: string, userId: string) {
    const updated = await this.prisma.notificationLog.updateMany({
      where: {
        tenantId,
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });

    return { success: true, count: updated.count };
  }
}
