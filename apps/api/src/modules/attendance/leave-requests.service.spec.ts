import { Test, TestingModule } from '@nestjs/testing';
import { LeaveRequestsService } from './leave-requests.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { LeaveStatus, AttendanceStatus } from '@edusaas/shared-types';

describe('LeaveRequestsService', () => {
  let service: LeaveRequestsService;
  let prisma: any;
  let auditService: any;
  let notificationsService: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockStudentId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    prisma = {
      student: {
        findFirst: jest.fn(),
      },
      leaveRequest: {
        create: jest.fn(),
        findFirst: jest.fn(),
        update: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      employee: {
        findFirst: jest.fn(),
      },
      attendance: {
        upsert: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    notificationsService = {
      notifyLeaveRequestStatus: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LeaveRequestsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<LeaveRequestsService>(LeaveRequestsService);
  });

  it('should create a pending leave request', async () => {
    prisma.student.findFirst.mockResolvedValue({
      id: mockStudentId,
      fullName: 'Ahmad Faiz',
      classStudents: [],
    });

    prisma.leaveRequest.create.mockResolvedValue({
      id: 'leave-1',
      tenantId: mockTenantId,
      studentId: mockStudentId,
      reason: 'Demam tinggi',
      startDate: new Date('2026-11-15'),
      endDate: new Date('2026-11-16'),
      status: LeaveStatus.PENDING,
      approvedByEmployeeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const res = await service.createLeaveRequest(mockTenantId, {
      studentId: mockStudentId,
      reason: 'Demam tinggi',
      startDate: '2026-11-15',
      endDate: '2026-11-16',
    });

    expect(res.status).toBe(LeaveStatus.PENDING);
    expect(res.reason).toBe('Demam tinggi');
  });

  it('should approve leave request and synchronize attendance status for each day', async () => {
    const existingLeave = {
      id: 'leave-1',
      tenantId: mockTenantId,
      studentId: mockStudentId,
      reason: 'Sakit flu',
      startDate: new Date('2026-11-15T00:00:00Z'),
      endDate: new Date('2026-11-16T00:00:00Z'),
      status: LeaveStatus.PENDING,
      student: { fullName: 'Ahmad Faiz', classStudents: [] },
      approvedBy: null,
    };

    prisma.leaveRequest.findFirst.mockResolvedValue(existingLeave);
    prisma.employee.findFirst.mockResolvedValue({ id: 'emp-1' });

    prisma.leaveRequest.update.mockResolvedValue({
      ...existingLeave,
      status: LeaveStatus.APPROVED,
      approvedByEmployeeId: 'emp-1',
      approvedBy: { fullName: 'Ustaz Abdullah' },
    });

    const res = await service.approveLeaveRequest(
      mockTenantId,
      'user-emp-1',
      'emp-1',
      'leave-1',
      { status: LeaveStatus.APPROVED },
    );

    expect(res.status).toBe(LeaveStatus.APPROVED);
    // Should upsert attendance for both days (15th and 16th)
    expect(prisma.attendance.upsert).toHaveBeenCalledTimes(2);
    expect(prisma.attendance.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ status: AttendanceStatus.SICK }),
      }),
    );
    expect(notificationsService.notifyLeaveRequestStatus).toHaveBeenCalled();
    expect(auditService.record).toHaveBeenCalled();
  });
});
