import { Test, TestingModule } from '@nestjs/testing';
import { TahfizService } from './tahfiz.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TahfizRecordType, TahfizFluencyRating } from '@edusaas/shared-types';

describe('TahfizService', () => {
  let service: TahfizService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    prisma = {
      halaqahGroup: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
      halaqahMember: {
        findUnique: jest.fn(),
        create: jest.fn(),
        delete: jest.fn(),
      },
      tahfizRecord: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      student: {
        findFirst: jest.fn(),
      },
      employee: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TahfizService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<TahfizService>(TahfizService);
  });

  it('should create halaqah group successfully', async () => {
    prisma.employee.findFirst.mockResolvedValue({
      id: 'ustaz-1',
      fullName: 'Ustaz Abdullah, Lc.',
    });

    prisma.halaqahGroup.create.mockResolvedValue({
      id: 'group-1',
      tenantId: mockTenantId,
      name: 'Halaqah Imam Ashim',
      ustazEmployeeId: 'ustaz-1',
      targetJuz: 30,
      schedule: "Ba'da Subuh",
      createdAt: new Date(),
      ustaz: { fullName: 'Ustaz Abdullah, Lc.' },
      members: [],
    });

    const result = await service.createHalaqahGroup(mockTenantId, {
      name: 'Halaqah Imam Ashim',
      ustazEmployeeId: 'ustaz-1',
      targetJuz: 30,
      schedule: "Ba'da Subuh",
    });

    expect(result.id).toBe('group-1');
    expect(result.name).toBe('Halaqah Imam Ashim');
    expect(result.ustazName).toBe('Ustaz Abdullah, Lc.');
    expect(result.memberCount).toBe(0);
  });

  it('should add member to halaqah group and reject duplicates', async () => {
    prisma.halaqahGroup.findFirst.mockResolvedValue({ id: 'group-1', name: 'Halaqah A' });
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1', fullName: 'Muhammad Alif' });
    prisma.halaqahMember.findUnique.mockResolvedValue({ id: 'existing-mem' });

    await expect(
      service.addHalaqahMember(mockTenantId, 'group-1', { studentId: 'student-1' })
    ).rejects.toThrow(BadRequestException);
  });

  it('should validate ayat and surah range when recording tahfiz entry', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1' });
    prisma.employee.findFirst.mockResolvedValue({ id: 'musyrif-1' });

    // Invalid surah (115)
    await expect(
      service.recordTahfizEntry(mockTenantId, {
        studentId: 'student-1',
        musyrifId: 'musyrif-1',
        recordType: TahfizRecordType.ZIYADAH,
        surahNumber: 115,
        surahName: 'Invalid',
        ayatStart: 1,
        ayatEnd: 10,
        juz: 30,
        fluencyRating: TahfizFluencyRating.MUMTAZ,
      })
    ).rejects.toThrow(BadRequestException);

    // Invalid ayat range (start > end)
    await expect(
      service.recordTahfizEntry(mockTenantId, {
        studentId: 'student-1',
        musyrifId: 'musyrif-1',
        recordType: TahfizRecordType.ZIYADAH,
        surahNumber: 2,
        surahName: 'Al-Baqarah',
        ayatStart: 50,
        ayatEnd: 40,
        juz: 1,
        fluencyRating: TahfizFluencyRating.MUMTAZ,
      })
    ).rejects.toThrow(BadRequestException);
  });

  it('should record tahfiz entry successfully', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1', fullName: 'Ahmad', nis: '1001' });
    prisma.employee.findFirst.mockResolvedValue({ id: 'musyrif-1', fullName: 'Ustaz Zaid' });

    prisma.tahfizRecord.create.mockResolvedValue({
      id: 'rec-1',
      tenantId: mockTenantId,
      studentId: 'student-1',
      musyrifId: 'musyrif-1',
      halaqahGroupId: 'group-1',
      recordType: TahfizRecordType.ZIYADAH,
      surahNumber: 78,
      surahName: 'An-Naba',
      ayatStart: 1,
      ayatEnd: 40,
      juz: 30,
      fluencyRating: TahfizFluencyRating.MUMTAZ,
      tajwidRating: 'MUMTAZ',
      notes: 'Makhraj huruf sangat baik',
      recordedAt: new Date(),
      student: { fullName: 'Ahmad', nis: '1001' },
      musyrif: { fullName: 'Ustaz Zaid' },
      halaqahGroup: { name: 'Halaqah A' },
    });

    const result = await service.recordTahfizEntry(mockTenantId, {
      studentId: 'student-1',
      musyrifId: 'musyrif-1',
      halaqahGroupId: 'group-1',
      recordType: TahfizRecordType.ZIYADAH,
      surahNumber: 78,
      surahName: 'An-Naba',
      ayatStart: 1,
      ayatEnd: 40,
      juz: 30,
      fluencyRating: TahfizFluencyRating.MUMTAZ,
      tajwidRating: 'MUMTAZ',
      notes: 'Makhraj huruf sangat baik',
    });

    expect(result.id).toBe('rec-1');
    expect(result.surahName).toBe('An-Naba');
    expect(result.fluencyRating).toBe(TahfizFluencyRating.MUMTAZ);
    expect(result.studentName).toBe('Ahmad');
  });

  it('should calculate student tahfiz progress summary accurately', async () => {
    prisma.student.findFirst.mockResolvedValue({ id: 'student-1', fullName: 'Ahmad', nis: '1001' });

    prisma.tahfizRecord.findMany.mockResolvedValue([
      {
        recordType: TahfizRecordType.ZIYADAH,
        juz: 30,
        surahName: 'An-Naziat',
        ayatStart: 1,
        ayatEnd: 46, // 46 verses
        fluencyRating: TahfizFluencyRating.MUMTAZ,
        recordedAt: new Date('2026-08-10'),
      },
      {
        recordType: TahfizRecordType.ZIYADAH,
        juz: 30,
        surahName: 'An-Naba',
        ayatStart: 1,
        ayatEnd: 40, // 40 verses
        fluencyRating: TahfizFluencyRating.JAYYID,
        recordedAt: new Date('2026-08-08'),
      },
      {
        recordType: TahfizRecordType.ZIYADAH,
        juz: 29,
        surahName: 'Al-Mulk',
        ayatStart: 1,
        ayatEnd: 30, // 30 verses
        fluencyRating: TahfizFluencyRating.JAYYID_JIDDAN,
        recordedAt: new Date('2026-08-05'),
      },
      {
        recordType: TahfizRecordType.MUROJA_AH,
        juz: 30,
        surahName: 'An-Naba',
        ayatStart: 1,
        ayatEnd: 40,
        fluencyRating: TahfizFluencyRating.MUMTAZ,
        recordedAt: new Date('2026-08-09'),
      },
    ]);

    const progress = await service.getStudentProgress(mockTenantId, 'student-1');

    expect(progress.studentId).toBe('student-1');
    expect(progress.ziyadahCount).toBe(3);
    expect(progress.murojaahCount).toBe(1);
    expect(progress.totalVersesMemorized).toBe(116); // 46 + 40 + 30
    expect(progress.totalJuzCompleted).toBe(2); // Juz 30 and Juz 29
    expect(progress.latestSurahName).toBe('An-Naziat');
  });
});
