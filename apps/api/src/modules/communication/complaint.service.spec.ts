import { Test, TestingModule } from '@nestjs/testing';
import { ComplaintService } from './complaint.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { ComplaintPriority, ComplaintStatus } from '@edusaas/shared-types';

describe('ComplaintService', () => {
  let service: ComplaintService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    prisma = {
      user: {
        findFirst: jest.fn(),
      },
      complaintTicket: {
        create: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
      announcement: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComplaintService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<ComplaintService>(ComplaintService);
  });

  it('should create complaint ticket with OPEN status', async () => {
    prisma.user.findFirst.mockResolvedValue({
      id: 'user-1',
      fullName: 'H. Sulaiman',
      email: 'sulaiman@gmail.com',
    });

    prisma.complaintTicket.create.mockResolvedValue({
      id: 'ticket-1',
      tenantId: mockTenantId,
      userId: 'user-1',
      title: 'Kran air asrama lantai 2 bocor',
      description: 'Mohon diperbaiki karena mengganggu wudhu santri menjelang subuh.',
      category: 'FASILITAS',
      priority: ComplaintPriority.HIGH,
      status: ComplaintStatus.OPEN,
      resolutionNotes: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: null,
      user: { fullName: 'H. Sulaiman', email: 'sulaiman@gmail.com' },
    });

    const result = await service.createComplaint(mockTenantId, 'user-1', {
      title: 'Kran air asrama lantai 2 bocor',
      description: 'Mohon diperbaiki karena mengganggu wudhu santri menjelang subuh.',
      category: 'FASILITAS',
      priority: ComplaintPriority.HIGH,
    });

    expect(result.id).toBe('ticket-1');
    expect(result.status).toBe(ComplaintStatus.OPEN);
    expect(result.priority).toBe(ComplaintPriority.HIGH);
    expect(result.userName).toBe('H. Sulaiman');
  });

  it('should resolve complaint ticket and record resolution notes', async () => {
    prisma.complaintTicket.findFirst.mockResolvedValue({
      id: 'ticket-1',
      tenantId: mockTenantId,
      status: ComplaintStatus.OPEN,
    });

    prisma.complaintTicket.update.mockResolvedValue({
      id: 'ticket-1',
      tenantId: mockTenantId,
      userId: 'user-1',
      title: 'Kran air asrama lantai 2 bocor',
      description: 'Mohon diperbaiki',
      category: 'FASILITAS',
      priority: ComplaintPriority.HIGH,
      status: ComplaintStatus.RESOLVED,
      resolutionNotes: 'Pipa dan kran baru telah diganti oleh tim sarpras pagi ini.',
      createdAt: new Date(),
      updatedAt: new Date(),
      resolvedAt: new Date(),
      user: { fullName: 'H. Sulaiman', email: 'sulaiman@gmail.com' },
    });

    const result = await service.resolveComplaint(mockTenantId, 'ticket-1', {
      status: ComplaintStatus.RESOLVED,
      resolutionNotes: 'Pipa dan kran baru telah diganti oleh tim sarpras pagi ini.',
    });

    expect(result.status).toBe(ComplaintStatus.RESOLVED);
    expect(result.resolutionNotes).toContain('Pipa dan kran baru');
    expect(result.resolvedAt).toBeDefined();
  });

  it('should create and list announcements', async () => {
    prisma.announcement.create.mockResolvedValue({
      id: 'ann-1',
      tenantId: mockTenantId,
      title: 'Pengumuman Libur Awal Ramadhan 1448 H',
      content: 'Santri dipulangkan mulai hari Jumat...',
      targetAudience: 'ALL',
      isPublished: true,
      publishedAt: new Date(),
      expiresAt: null,
    });

    const created = await service.createAnnouncement(mockTenantId, {
      title: 'Pengumuman Libur Awal Ramadhan 1448 H',
      content: 'Santri dipulangkan mulai hari Jumat...',
      targetAudience: 'ALL',
    });

    expect(created.id).toBe('ann-1');
    expect(created.isPublished).toBe(true);

    prisma.announcement.findMany.mockResolvedValue([
      {
        id: 'ann-1',
        tenantId: mockTenantId,
        title: 'Pengumuman Libur Awal Ramadhan 1448 H',
        content: 'Santri dipulangkan mulai hari Jumat...',
        targetAudience: 'ALL',
        isPublished: true,
        publishedAt: new Date(),
        expiresAt: null,
      },
    ]);

    const list = await service.listAnnouncements(mockTenantId, 'GUARDIANS');
    expect(list.length).toBe(1);
    expect(list[0].title).toBe('Pengumuman Libur Awal Ramadhan 1448 H');
  });
});
