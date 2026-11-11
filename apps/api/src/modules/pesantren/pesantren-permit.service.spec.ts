import { Test, TestingModule } from '@nestjs/testing';
import { PesantrenPermitService } from './pesantren-permit.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PesantrenPermitType, PesantrenPermitStatus } from '@edusaas/shared-types';

describe('PesantrenPermitService', () => {
  let service: PesantrenPermitService;
  let prisma: any;
  let notificationsService: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    prisma = {
      student: {
        findFirst: jest.fn(),
      },
      employee: {
        findFirst: jest.fn(),
      },
      pesantrenPermit: {
        findFirst: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
    };

    notificationsService = {
      sendNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PesantrenPermitService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
        {
          provide: NotificationsService,
          useValue: notificationsService,
        },
      ],
    }).compile();

    service = module.get<PesantrenPermitService>(PesantrenPermitService);
  });

  it('should validate departure and return dates on createPermit', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });

    // expectedReturn <= expectedDeparture
    await expect(
      service.createPermit(mockTenantId, {
        studentId: 'student-1',
        permitType: PesantrenPermitType.PULANG_KE_RUMAH,
        reason: 'Acara keluarga',
        pickupPersonName: 'Ahmad S.',
        pickupPersonRelation: 'Ayah',
        pickupPersonPhone: '08123456789',
        expectedDeparture: '2026-08-15T10:00:00Z',
        expectedReturn: '2026-08-15T09:00:00Z',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should reject createPermit if student already has active permit outside', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
    prisma.pesantrenPermit.findFirst.mockResolvedValue({
      id: 'active-permit',
      status: PesantrenPermitStatus.ACTIVE_OUTSIDE,
    });

    await expect(
      service.createPermit(mockTenantId, {
        studentId: 'student-1',
        permitType: PesantrenPermitType.PULANG_KE_RUMAH,
        reason: 'Acara keluarga',
        pickupPersonName: 'Ahmad S.',
        pickupPersonRelation: 'Ayah',
        pickupPersonPhone: '08123456789',
        expectedDeparture: '2026-08-15T10:00:00Z',
        expectedReturn: '2026-08-17T17:00:00Z',
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should create permit successfully with unique gate token', async () => {
    prisma.student.findFirst.mockResolvedValue({
      id: 'student-1',
      fullName: 'Muhammad Zaid',
      nis: '2026001',
      guardians: [],
    });
    prisma.pesantrenPermit.findFirst.mockResolvedValue(null);

    prisma.pesantrenPermit.create.mockResolvedValue({
      id: 'permit-1',
      tenantId: mockTenantId,
      studentId: 'student-1',
      permitType: PesantrenPermitType.PULANG_KE_RUMAH,
      reason: 'Libur Idul Adha',
      pickupPersonName: 'H. Sulaiman',
      pickupPersonRelation: 'Ayah',
      pickupPersonPhone: '081299998888',
      expectedDeparture: new Date('2026-08-15T08:00:00Z'),
      expectedReturn: new Date('2026-08-18T17:00:00Z'),
      securityGateToken: 'GATE-20260815-ABC123',
      status: PesantrenPermitStatus.PENDING_APPROVAL,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: { fullName: 'Muhammad Zaid', nis: '2026001' },
      approvedByMusyrif: null,
      approvedByKeasramaan: null,
    });

    const result = await service.createPermit(mockTenantId, {
      studentId: 'student-1',
      permitType: PesantrenPermitType.PULANG_KE_RUMAH,
      reason: 'Libur Idul Adha',
      pickupPersonName: 'H. Sulaiman',
      pickupPersonRelation: 'Ayah',
      pickupPersonPhone: '081299998888',
      expectedDeparture: '2026-08-15T08:00:00Z',
      expectedReturn: '2026-08-18T17:00:00Z',
    });

    expect(result.id).toBe('permit-1');
    expect(result.status).toBe(PesantrenPermitStatus.PENDING_APPROVAL);
    expect(result.securityGateToken).toContain('GATE-');
  });

  it('should approve permit through multi-stage workflow', async () => {
    prisma.pesantrenPermit.findFirst.mockResolvedValue({
      id: 'permit-1',
      status: PesantrenPermitStatus.PENDING_APPROVAL,
      student: {
        fullName: 'Zaid',
        guardians: [{ guardian: { userId: 'parent-user-1' } }],
      },
    });
    prisma.employee.findFirst.mockResolvedValue({ id: 'musyrif-1', fullName: 'Ustaz Musyrif' });

    prisma.pesantrenPermit.update.mockResolvedValue({
      id: 'permit-1',
      tenantId: mockTenantId,
      studentId: 'student-1',
      permitType: PesantrenPermitType.PULANG_KE_RUMAH,
      reason: 'Izin',
      pickupPersonName: 'Ayah',
      pickupPersonRelation: 'Ayah',
      pickupPersonPhone: '0812',
      expectedDeparture: new Date(),
      expectedReturn: new Date(),
      securityGateToken: 'GATE-TOKEN',
      status: PesantrenPermitStatus.APPROVED_BY_MUSYRIF,
      approvedByMusyrifId: 'musyrif-1',
      createdAt: new Date(),
      updatedAt: new Date(),
      student: { fullName: 'Zaid', nis: '1001' },
      approvedByMusyrif: { fullName: 'Ustaz Musyrif' },
      approvedByKeasramaan: null,
    });

    const result = await service.approvePermit(mockTenantId, 'permit-1', {
      approvalStage: 'MUSYRIF',
      status: 'APPROVED',
      approverEmployeeId: 'musyrif-1',
      notes: 'Disetujui musyrif kamar',
    });

    expect(result.status).toBe(PesantrenPermitStatus.APPROVED_BY_MUSYRIF);
    expect(result.approvedByMusyrifName).toBe('Ustaz Musyrif');
  });

  it('should handle security gate CHECK_OUT and CHECK_IN with status update', async () => {
    const expectedReturn = new Date(Date.now() + 3600000); // 1 hour later

    // 1. Check out
    prisma.pesantrenPermit.findFirst.mockResolvedValueOnce({
      id: 'permit-1',
      status: PesantrenPermitStatus.APPROVED_BY_KEASRAMAAN,
      expectedReturn,
      pickupPersonName: 'Ayah',
      pickupPersonRelation: 'Ayah',
      student: {
        fullName: 'Zaid',
        guardians: [{ guardian: { userId: 'parent-user-1' } }],
      },
    });

    prisma.pesantrenPermit.update.mockResolvedValueOnce({
      id: 'permit-1',
      tenantId: mockTenantId,
      studentId: 'student-1',
      permitType: PesantrenPermitType.PULANG_KE_RUMAH,
      reason: 'Izin',
      pickupPersonName: 'Ayah',
      pickupPersonRelation: 'Ayah',
      pickupPersonPhone: '0812',
      expectedDeparture: new Date(),
      expectedReturn,
      actualDeparture: new Date(),
      actualReturn: null,
      securityGateToken: 'GATE-TOKEN',
      status: PesantrenPermitStatus.ACTIVE_OUTSIDE,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: { fullName: 'Zaid', nis: '1001' },
      approvedByMusyrif: null,
      approvedByKeasramaan: null,
    });

    const checkoutResult = await service.securityGateCheck(mockTenantId, {
      securityGateToken: 'GATE-TOKEN',
      action: 'CHECK_OUT',
      checkedByEmployeeId: 'security-1',
    });

    expect(checkoutResult.status).toBe(PesantrenPermitStatus.ACTIVE_OUTSIDE);
    expect(notificationsService.sendNotification).toHaveBeenCalled();

    // 2. Check in (on time)
    prisma.pesantrenPermit.findFirst.mockResolvedValueOnce({
      id: 'permit-1',
      status: PesantrenPermitStatus.ACTIVE_OUTSIDE,
      expectedReturn,
      pickupPersonName: 'Ayah',
      pickupPersonRelation: 'Ayah',
      student: {
        fullName: 'Zaid',
        guardians: [{ guardian: { userId: 'parent-user-1' } }],
      },
    });

    prisma.pesantrenPermit.update.mockResolvedValueOnce({
      id: 'permit-1',
      tenantId: mockTenantId,
      studentId: 'student-1',
      permitType: PesantrenPermitType.PULANG_KE_RUMAH,
      reason: 'Izin',
      pickupPersonName: 'Ayah',
      pickupPersonRelation: 'Ayah',
      pickupPersonPhone: '0812',
      expectedDeparture: new Date(),
      expectedReturn,
      actualDeparture: new Date(),
      actualReturn: new Date(),
      securityGateToken: 'GATE-TOKEN',
      status: PesantrenPermitStatus.RETURNED,
      createdAt: new Date(),
      updatedAt: new Date(),
      student: { fullName: 'Zaid', nis: '1001' },
      approvedByMusyrif: null,
      approvedByKeasramaan: null,
    });

    const checkinResult = await service.securityGateCheck(mockTenantId, {
      securityGateToken: 'GATE-TOKEN',
      action: 'CHECK_IN',
      checkedByEmployeeId: 'security-1',
    });

    expect(checkinResult.status).toBe(PesantrenPermitStatus.RETURNED);
  });
});
