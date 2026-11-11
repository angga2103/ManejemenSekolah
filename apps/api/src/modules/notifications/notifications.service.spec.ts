import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsService } from './notifications.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationChannel, NotificationStatus } from '@edusaas/shared-types';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '33333333-3333-3333-3333-333333333333';

  beforeEach(async () => {
    prisma = {
      notificationLog: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      },
      student: {
        findUnique: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
  });

  it('should send a notification and persist it to NotificationLog', async () => {
    prisma.notificationLog.create.mockResolvedValue({
      id: 'notif-1',
      tenantId: mockTenantId,
      userId: mockUserId,
      title: 'Presensi Masuk',
      body: 'Santri Anda telah masuk kelas.',
      channel: NotificationChannel.IN_APP,
      status: NotificationStatus.SENT,
      category: 'ATTENDANCE',
      metadata: null,
      readAt: null,
      createdAt: new Date(),
    });

    const res = await service.sendNotification(mockTenantId, {
      userId: mockUserId,
      title: 'Presensi Masuk',
      body: 'Santri Anda telah masuk kelas.',
      channel: NotificationChannel.IN_APP,
      category: 'ATTENDANCE',
    });

    expect(res.id).toBe('notif-1');
    expect(res.status).toBe(NotificationStatus.SENT);
    expect(prisma.notificationLog.create).toHaveBeenCalled();
  });

  it('should mark a notification as read', async () => {
    prisma.notificationLog.findFirst.mockResolvedValue({
      id: 'notif-1',
      tenantId: mockTenantId,
      userId: mockUserId,
    });

    prisma.notificationLog.update.mockResolvedValue({
      id: 'notif-1',
      readAt: new Date(),
      status: NotificationStatus.READ,
    });

    const res = await service.markAsRead(mockTenantId, mockUserId, 'notif-1');
    expect(res.success).toBe(true);
    expect(prisma.notificationLog.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: NotificationStatus.READ }),
      }),
    );
  });
});
