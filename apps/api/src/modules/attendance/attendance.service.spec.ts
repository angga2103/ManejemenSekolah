import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceService } from './attendance.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { NotificationsService } from '../notifications/notifications.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AttendanceType, AttendanceStatus, AttendanceMethod } from '@edusaas/shared-types';

describe('AttendanceService', () => {
  let service: AttendanceService;
  let prisma: any;
  let auditService: any;
  let notificationsService: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockStudentId = '22222222-2222-2222-2222-222222222222';

  beforeEach(async () => {
    prisma = {
      student: {
        findFirst: jest.fn(),
        count: jest.fn(),
      },
      attendance: {
        findFirst: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        upsert: jest.fn(),
        count: jest.fn(),
      },
      leaveRequest: {
        findFirst: jest.fn(),
      },
      classGroup: {
        findFirst: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    notificationsService = {
      notifyStudentAttendance: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AttendanceService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: NotificationsService, useValue: notificationsService },
      ],
    }).compile();

    service = module.get<AttendanceService>(AttendanceService);
  });

  describe('Dynamic QR Generation & Verification', () => {
    it('should generate a signed dynamic QR token with expiration timestamp', () => {
      const res = service.generateDynamicQr(mockTenantId, {
        type: AttendanceType.CLASS,
        validitySeconds: 60,
      });

      expect(res.token).toBeDefined();
      expect(typeof res.token).toBe('string');
      expect(res.expiresAt).toBeGreaterThan(Date.now());
      expect(res.validitySeconds).toBe(60);
    });

    it('should reject QR verification if token has invalid signature or tampering', async () => {
      const validQr = service.generateDynamicQr(mockTenantId, {
        type: AttendanceType.CLASS,
        validitySeconds: 60,
      });

      // Tamper with the token payload
      const decoded = JSON.parse(Buffer.from(validQr.token, 'base64url').toString('utf8'));
      decoded.type = AttendanceType.DORMITORY; // altered data
      const tamperedToken = Buffer.from(JSON.stringify(decoded)).toString('base64url');

      await expect(
        service.verifyAndRecordDynamicQr(mockTenantId, {
          token: tamperedToken,
          studentId: mockStudentId,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject QR verification if token is expired', async () => {
      const expiredQr = service.generateDynamicQr(mockTenantId, {
        type: AttendanceType.CLASS,
        validitySeconds: -10, // already expired
      });

      await expect(
        service.verifyAndRecordDynamicQr(mockTenantId, {
          token: expiredQr.token,
          studentId: mockStudentId,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Attendance Recording & Lateness', () => {
    it('should record on-time attendance and dispatch guardian notification', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: mockStudentId,
        fullName: 'Ahmad Faiz',
        nis: '2026001',
        classStudents: [{ classGroup: { name: '10 MIPA 1' } }],
      });

      prisma.attendance.findUnique.mockResolvedValue(null);
      prisma.leaveRequest.findFirst.mockResolvedValue(null);

      // On-time check in: 06:55 AM
      const onTime = new Date('2026-11-12T06:55:00Z');
      prisma.attendance.create.mockResolvedValue({
        id: 'att-1',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        type: AttendanceType.CLASS,
        status: AttendanceStatus.PRESENT,
        method: AttendanceMethod.QR_DYNAMIC,
        recordedDate: new Date('2026-11-12T00:00:00Z'),
        checkInTime: onTime,
        checkOutTime: null,
        createdAt: new Date(),
      });

      const result = await service.recordAttendance(mockTenantId, {
        studentId: mockStudentId,
        type: AttendanceType.CLASS,
        checkInTime: onTime.toISOString(),
      });

      expect(result.status).toBe(AttendanceStatus.PRESENT);
      expect(prisma.attendance.create).toHaveBeenCalled();
      expect(notificationsService.notifyStudentAttendance).toHaveBeenCalledWith(
        mockTenantId,
        mockStudentId,
        expect.objectContaining({ status: AttendanceStatus.PRESENT }),
      );
    });

    it('should calculate LATE status when check-in is after 07:15', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: mockStudentId,
        fullName: 'Ahmad Faiz',
        nis: '2026001',
        classStudents: [{ classGroup: { name: '10 MIPA 1' } }],
      });

      prisma.attendance.findUnique.mockResolvedValue(null);
      prisma.leaveRequest.findFirst.mockResolvedValue(null);

      // Late check in: 07:45 AM local
      const lateTime = new Date();
      lateTime.setHours(7, 45, 0, 0);

      prisma.attendance.create.mockImplementation((args) => ({
        id: 'att-late',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        type: args.data.type,
        status: args.data.status,
        method: args.data.method,
        recordedDate: args.data.recordedDate,
        checkInTime: args.data.checkInTime,
        createdAt: new Date(),
      }));

      const result = await service.recordAttendance(mockTenantId, {
        studentId: mockStudentId,
        type: AttendanceType.CLASS,
        checkInTime: lateTime.toISOString(),
      });

      expect(result.status).toBe(AttendanceStatus.LATE);
    });
  });

  describe('Offline Sync Batch Protocol', () => {
    it('should process batch records idempotently and report accepted, duplicate and failed counts', async () => {
      prisma.student.findFirst
        .mockResolvedValueOnce({ id: 's1' })
        .mockResolvedValueOnce({ id: 's2' })
        .mockResolvedValueOnce(null); // s3 not found

      prisma.attendance.findUnique
        .mockResolvedValueOnce(null) // s1: new
        .mockResolvedValueOnce({ id: 'existing-att' }); // s2: duplicate

      prisma.attendance.create.mockResolvedValue({ id: 'new-att' });

      const syncResult = await service.processOfflineSyncBatch(mockTenantId, {
        deviceId: 'scanner-device-01',
        batchTimestamp: new Date().toISOString(),
        records: [
          {
            clientRecordId: 'rec-1',
            studentId: 's1',
            type: AttendanceType.CLASS,
            status: AttendanceStatus.PRESENT,
            method: AttendanceMethod.OFFLINE_SYNC,
            recordedDate: '2026-11-12',
          },
          {
            clientRecordId: 'rec-2',
            studentId: 's2',
            type: AttendanceType.CLASS,
            status: AttendanceStatus.PRESENT,
            method: AttendanceMethod.OFFLINE_SYNC,
            recordedDate: '2026-11-12',
          },
          {
            clientRecordId: 'rec-3',
            studentId: 's3',
            type: AttendanceType.CLASS,
            status: AttendanceStatus.PRESENT,
            method: AttendanceMethod.OFFLINE_SYNC,
            recordedDate: '2026-11-12',
          },
        ],
      });

      expect(syncResult.syncedCount).toBe(1);
      expect(syncResult.duplicateCount).toBe(1);
      expect(syncResult.failedCount).toBe(1);
      expect(syncResult.failures[0].studentId).toBe('s3');
    });
  });

  describe('Audited Attendance Corrections', () => {
    it('should update attendance status and write to immutable audit log', async () => {
      prisma.attendance.findFirst.mockResolvedValue({
        id: 'att-corr-1',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        status: AttendanceStatus.ABSENT,
        notes: 'Tidak ada kabar',
        student: { fullName: 'Ahmad Faiz', classStudents: [] },
      });

      prisma.attendance.update.mockResolvedValue({
        id: 'att-corr-1',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        status: AttendanceStatus.SICK,
        recordedDate: new Date('2026-11-12'),
        notes: 'Tidak ada kabar [Koreksi: Surat dokter terlampir]',
        createdAt: new Date(),
      });

      const result = await service.correctAttendance(mockTenantId, 'user-admin', 'att-corr-1', {
        newStatus: AttendanceStatus.SICK,
        notes: 'Surat dokter terlampir',
      });

      expect(result.status).toBe(AttendanceStatus.SICK);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'CORRECTION',
          resource: 'Attendance',
          resourceId: 'att-corr-1',
        }),
      );
    });
  });
});
