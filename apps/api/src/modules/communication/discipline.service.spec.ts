import { Test, TestingModule } from '@nestjs/testing';
import { DisciplineService } from './discipline.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SanctionLetterType } from '@edusaas/shared-types';

describe('DisciplineService', () => {
  let service: DisciplineService;
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
      studentViolation: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      studentAchievement: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
    };

    notificationsService = {
      sendNotification: jest.fn().mockResolvedValue({ id: 'notif-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DisciplineService,
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

    service = module.get<DisciplineService>(DisciplineService);
  });

  it('should reject negative points on recordViolation', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
    prisma.employee.findFirst.mockResolvedValue({ id: 'employee-1' });

    await expect(
      service.recordViolation(mockTenantId, {
        studentId: 'student-1',
        recordedByEmployeeId: 'employee-1',
        title: 'Terlambat halaqah',
        violationDate: '2026-08-15',
        points: -5,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should record violation and notify parent with sanction warning', async () => {
    prisma.student.findFirst.mockResolvedValue({
      id: 'student-1',
      fullName: 'Ahmad Zaki',
      nis: '2026001',
      guardians: [
        {
          guardian: { userId: 'parent-user-1' },
        },
      ],
    });
    prisma.employee.findFirst.mockResolvedValue({
      id: 'employee-1',
      fullName: 'Ustaz Ridwan',
    });

    prisma.studentViolation.create.mockResolvedValue({
      id: 'v-1',
      tenantId: mockTenantId,
      studentId: 'student-1',
      recordedByEmployeeId: 'employee-1',
      violationDate: new Date('2026-08-15'),
      title: 'Keluar asrama tanpa izin',
      points: 25,
      sanction: 'Teguran lisan & panggilan musyrif',
      status: 'RECORDED',
      createdAt: new Date(),
      student: { fullName: 'Ahmad Zaki', nis: '2026001' },
      recordedBy: { fullName: 'Ustaz Ridwan' },
    });

    // Mock findMany for getStudentDisciplineSummary
    prisma.studentViolation.findMany.mockResolvedValue([
      { points: 25, violationDate: new Date('2026-08-15') },
    ]);

    const result = await service.recordViolation(mockTenantId, {
      studentId: 'student-1',
      recordedByEmployeeId: 'employee-1',
      title: 'Keluar asrama tanpa izin',
      violationDate: '2026-08-15',
      points: 25,
      sanction: 'Teguran lisan & panggilan musyrif',
    });

    expect(result.id).toBe('v-1');
    expect(result.points).toBe(25);
    expect(notificationsService.sendNotification).toHaveBeenCalledWith(
      mockTenantId,
      expect.objectContaining({
        userId: 'parent-user-1',
        title: expect.stringContaining('Catatan Tata Tertib'),
        metadata: expect.objectContaining({
          totalPoints: 25,
          sanctionLetter: SanctionLetterType.SP1,
        }),
      })
    );
  });

  it('should accurately compute sanction letter thresholds', async () => {
    prisma.student.findFirst.mockResolvedValue({
      id: 'student-1',
      fullName: 'Ahmad Zaki',
      nis: '2026001',
    });

    // 1. Total points < 25 -> NONE
    prisma.studentViolation.findMany.mockResolvedValueOnce([
      { points: 10, violationDate: new Date() },
    ]);
    const summary1 = await service.getStudentDisciplineSummary(mockTenantId, 'student-1');
    expect(summary1.totalPoints).toBe(10);
    expect(summary1.sanctionLetter).toBe(SanctionLetterType.NONE);

    // 2. Total points >= 25 -> SP1
    prisma.studentViolation.findMany.mockResolvedValueOnce([
      { points: 15, violationDate: new Date() },
      { points: 10, violationDate: new Date() },
    ]);
    const summary2 = await service.getStudentDisciplineSummary(mockTenantId, 'student-1');
    expect(summary2.totalPoints).toBe(25);
    expect(summary2.sanctionLetter).toBe(SanctionLetterType.SP1);

    // 3. Total points >= 50 -> SP2
    prisma.studentViolation.findMany.mockResolvedValueOnce([
      { points: 30, violationDate: new Date() },
      { points: 25, violationDate: new Date() },
    ]);
    const summary3 = await service.getStudentDisciplineSummary(mockTenantId, 'student-1');
    expect(summary3.totalPoints).toBe(55);
    expect(summary3.sanctionLetter).toBe(SanctionLetterType.SP2);

    // 4. Total points >= 75 -> SP3_CALL_PARENT
    prisma.studentViolation.findMany.mockResolvedValueOnce([
      { points: 50, violationDate: new Date() },
      { points: 30, violationDate: new Date() },
    ]);
    const summary4 = await service.getStudentDisciplineSummary(mockTenantId, 'student-1');
    expect(summary4.totalPoints).toBe(80);
    expect(summary4.sanctionLetter).toBe(SanctionLetterType.SP3_CALL_PARENT);
  });

  it('should record achievement and notify parent', async () => {
    prisma.student.findFirst.mockResolvedValue({
      id: 'student-1',
      fullName: 'Ahmad Zaki',
      nis: '2026001',
      guardians: [
        {
          guardian: { userId: 'parent-user-1' },
        },
      ],
    });

    prisma.studentAchievement.create.mockResolvedValue({
      id: 'ach-1',
      tenantId: mockTenantId,
      studentId: 'student-1',
      title: 'Juara 1 Musabaqah Hifzil Quran (MHQ) 10 Juz',
      level: 'PROVINSI',
      achievementDate: new Date('2026-08-10'),
      points: 50,
      certificateUrl: 'https://cdn.edusaas.id/certificates/ach-1.pdf',
      createdAt: new Date(),
      student: { fullName: 'Ahmad Zaki', nis: '2026001' },
    });

    const result = await service.recordAchievement(mockTenantId, {
      studentId: 'student-1',
      title: 'Juara 1 Musabaqah Hifzil Quran (MHQ) 10 Juz',
      level: 'PROVINSI',
      achievementDate: '2026-08-10',
      points: 50,
      certificateUrl: 'https://cdn.edusaas.id/certificates/ach-1.pdf',
    });

    expect(result.id).toBe('ach-1');
    expect(result.title).toBe('Juara 1 Musabaqah Hifzil Quran (MHQ) 10 Juz');
    expect(result.points).toBe(50);
    expect(notificationsService.sendNotification).toHaveBeenCalledWith(
      mockTenantId,
      expect.objectContaining({
        userId: 'parent-user-1',
        title: expect.stringContaining('Selamat! Prestasi Santri'),
      })
    );
  });
});
