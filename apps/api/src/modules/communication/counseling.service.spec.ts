import { Test, TestingModule } from '@nestjs/testing';
import { CounselingService } from './counseling.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotFoundException } from '@nestjs/common';

describe('CounselingService', () => {
  let service: CounselingService;
  let prisma: any;

  const mockTenantId = 'tenant-uuid-1';

  beforeEach(async () => {
    prisma = {
      student: {
        findFirst: jest.fn(),
      },
      employee: {
        findFirst: jest.fn(),
      },
      counselingRecord: {
        create: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CounselingService,
        {
          provide: PrismaService,
          useValue: prisma,
        },
      ],
    }).compile();

    service = module.get<CounselingService>(CounselingService);
  });

  it('should create counseling session successfully', async () => {
    prisma.student.findFirst.mockResolvedValue({
      id: 'student-1',
      fullName: 'Ahmad Zaki',
      nis: '2026001',
    });
    prisma.employee.findFirst.mockResolvedValue({
      id: 'counselor-1',
      fullName: 'Dra. Hj. Nurul Hidayah, M.Pd.',
    });

    prisma.counselingRecord.create.mockResolvedValue({
      id: 'session-1',
      tenantId: mockTenantId,
      studentId: 'student-1',
      counselorEmployeeId: 'counselor-1',
      sessionDate: new Date('2026-08-12'),
      category: 'BEHAVIORAL',
      notes: 'Santri mengalami kesulitan adaptasi asrama pada bulan pertama.',
      actionPlan: 'Musyrif kamar memberikan pendampingan mentoring berkala.',
      followUpRequired: true,
      createdAt: new Date(),
      student: { fullName: 'Ahmad Zaki', nis: '2026001' },
      counselor: { fullName: 'Dra. Hj. Nurul Hidayah, M.Pd.' },
    });

    const result = await service.createSession(mockTenantId, {
      studentId: 'student-1',
      counselorEmployeeId: 'counselor-1',
      sessionDate: '2026-08-12',
      category: 'BEHAVIORAL',
      notes: 'Santri mengalami kesulitan adaptasi asrama pada bulan pertama.',
      actionPlan: 'Musyrif kamar memberikan pendampingan mentoring berkala.',
      followUpRequired: true,
    });

    expect(result.id).toBe('session-1');
    expect(result.studentName).toBe('Ahmad Zaki');
    expect(result.counselorName).toBe('Dra. Hj. Nurul Hidayah, M.Pd.');
    expect(result.followUpRequired).toBe(true);
  });

  it('should list counseling sessions with followUpOnly filter', async () => {
    prisma.counselingRecord.findMany.mockResolvedValue([
      {
        id: 'session-1',
        tenantId: mockTenantId,
        studentId: 'student-1',
        counselorEmployeeId: 'counselor-1',
        sessionDate: new Date('2026-08-12'),
        category: 'BEHAVIORAL',
        notes: 'Catatan konseling rahasia',
        actionPlan: 'Rencana aksi',
        followUpRequired: true,
        createdAt: new Date(),
        student: { fullName: 'Ahmad Zaki', nis: '2026001' },
        counselor: { fullName: 'Dra. Nurul' },
      },
    ]);

    const result = await service.listSessions(mockTenantId, { followUpOnly: true });

    expect(result.length).toBe(1);
    expect(prisma.counselingRecord.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ followUpRequired: true }),
      })
    );
  });
});
