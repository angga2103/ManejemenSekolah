import { Test, TestingModule } from '@nestjs/testing';
import { ReportCardsService } from './report-cards.service';
import { GradesService } from './grades.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AttendanceStatus } from '@edusaas/shared-types';
import { Prisma } from '@prisma/client';

describe('ReportCardsService', () => {
  let service: ReportCardsService;
  let prisma: any;
  let auditService: any;
  let gradesService: any;

  const mockTenantId = '11111111-1111-1111-1111-111111111111';
  const mockUserId = '99999999-9999-9999-9999-999999999999';
  const mockStudentId = '22222222-2222-2222-2222-222222222222';
  const mockClassGroupId = '55555555-5555-5555-5555-555555555555';
  const mockAcademicYearId = '44444444-4444-4444-4444-444444444444';

  beforeEach(async () => {
    prisma = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue({ id: mockTenantId, name: 'Pondok Pesantren Al-Hikmah' }),
      },
      student: {
        findFirst: jest.fn(),
      },
      classGroup: {
        findFirst: jest.fn(),
      },
      classStudent: {
        count: jest.fn().mockResolvedValue(30),
        findMany: jest.fn(),
      },
      academicYear: {
        findFirst: jest.fn(),
      },
      attendance: {
        findMany: jest.fn(),
      },
      reportCard: {
        create: jest.fn(),
        update: jest.fn(),
        findFirst: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
      guardian: {
        findFirst: jest.fn(),
      },
      studentGuardian: {
        findFirst: jest.fn(),
      },
    };

    auditService = {
      record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
    };

    gradesService = {
      calculateStudentSubjectScores: jest.fn(),
      calculatePredicate: jest.fn((score: number) => {
        if (score >= 90) return 'A';
        if (score >= 80) return 'B';
        if (score >= 70) return 'C';
        return 'D';
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportCardsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: auditService },
        { provide: GradesService, useValue: gradesService },
      ],
    }).compile();

    service = module.get<ReportCardsService>(ReportCardsService);
  });

  describe('generateReportCard', () => {
    it('should generate report card with integrated attendance, dual curriculum averages and remarks', async () => {
      prisma.student.findFirst.mockResolvedValue({
        id: mockStudentId,
        fullName: 'Muhammad Al-Fatih',
        nis: '2026001',
        nisn: '0012345678',
      });

      prisma.classGroup.findFirst.mockResolvedValue({
        id: mockClassGroupId,
        name: 'Kelas 10 Diniyah Ula',
      });

      prisma.academicYear.findFirst.mockResolvedValue({
        id: mockAcademicYearId,
        name: '2026/2027 Ganjil',
        startDate: new Date('2026-07-01'),
        endDate: new Date('2026-12-31'),
      });

      gradesService.calculateStudentSubjectScores.mockResolvedValue([
        { subjectId: 's1', subjectName: 'Nahwu', finalScore: 90, curriculumType: 'PESANTREN_DINIYAH' },
        { subjectId: 's2', subjectName: 'Matematika', finalScore: 80, curriculumType: 'FORMAL_NATIONAL' },
      ]);

      prisma.attendance.findMany.mockResolvedValue([
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.PRESENT },
        { status: AttendanceStatus.LATE },
        { status: AttendanceStatus.SICK },
      ]);

      prisma.reportCard.findFirst.mockResolvedValue(null);

      const createdReportCard = {
        id: 'rc-1',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        classGroupId: mockClassGroupId,
        academicYearId: mockAcademicYearId,
        semester: 'ODD',
        finalAverage: new Prisma.Decimal(85),
        ranking: null,
        remarks: 'Prestasi sangat baik',
        pdfUrl: '/api/v1/report-cards/rc-1/print',
        issuedAt: new Date(),
        student: { fullName: 'Muhammad Al-Fatih', nis: '2026001', nisn: '0012345678' },
        classGroup: { name: 'Kelas 10 Diniyah Ula' },
        academicYear: { name: '2026/2027 Ganjil' },
      };

      prisma.reportCard.create.mockResolvedValue(createdReportCard);
      prisma.reportCard.update.mockResolvedValue(createdReportCard);

      const result = await service.generateReportCard(mockTenantId, mockUserId, {
        studentId: mockStudentId,
        classGroupId: mockClassGroupId,
        academicYearId: mockAcademicYearId,
        semester: 'ODD',
      });

      expect(result.finalAverage).toBe(85);
      expect(result.overallPredicate).toBe('B');
      expect(result.attendanceSummary.presentCount).toBe(2);
      expect(result.attendanceSummary.lateCount).toBe(1);
      expect(result.attendanceSummary.sickCount).toBe(1);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'REPORT_CARD_GENERATED' }),
      );
    });
  });

  describe('generateBatchReportCards', () => {
    it('should generate report cards for entire class, compute ranking by score descending, and persist ranks', async () => {
      const student1 = { studentId: 'student-1', student: { id: 'student-1', fullName: 'Santri A' } };
      const student2 = { studentId: 'student-2', student: { id: 'student-2', fullName: 'Santri B' } };

      prisma.classGroup.findFirst.mockResolvedValue({
        id: mockClassGroupId,
        classStudents: [student1, student2],
      });

      // Mock individual report cards generation
      jest.spyOn(service, 'generateReportCard')
        .mockResolvedValueOnce({
          id: 'rc-1',
          tenantId: mockTenantId,
          studentId: 'student-1',
          studentName: 'Santri A',
          studentNis: '001',
          classGroupId: mockClassGroupId,
          classGroupName: '10 MIPA',
          academicYearId: mockAcademicYearId,
          academicYearName: '2026/2027',
          semester: 'ODD',
          finalAverage: 82, // Rank 2
          overallPredicate: 'B',
          ranking: null,
          totalStudentsInClass: 2,
          remarks: 'Baik',
          pdfUrl: '/api/v1/report-cards/rc-1/print',
          issuedAt: new Date().toISOString(),
          subjects: [],
          attendanceSummary: { presentCount: 20, lateCount: 0, sickCount: 0, permissionCount: 0, absentCount: 0 },
        })
        .mockResolvedValueOnce({
          id: 'rc-2',
          tenantId: mockTenantId,
          studentId: 'student-2',
          studentName: 'Santri B',
          studentNis: '002',
          classGroupId: mockClassGroupId,
          classGroupName: '10 MIPA',
          academicYearId: mockAcademicYearId,
          academicYearName: '2026/2027',
          semester: 'ODD',
          finalAverage: 95, // Rank 1
          overallPredicate: 'A',
          ranking: null,
          totalStudentsInClass: 2,
          remarks: 'Istimewa',
          pdfUrl: '/api/v1/report-cards/rc-2/print',
          issuedAt: new Date().toISOString(),
          subjects: [],
          attendanceSummary: { presentCount: 20, lateCount: 0, sickCount: 0, permissionCount: 0, absentCount: 0 },
        });

      const batchResults = await service.generateBatchReportCards(mockTenantId, mockUserId, {
        classGroupId: mockClassGroupId,
        academicYearId: mockAcademicYearId,
        semester: 'ODD',
      });

      expect(batchResults).toHaveLength(2);
      // Student B (95) should be rank 1
      expect(batchResults[0].studentId).toBe('student-2');
      expect(batchResults[0].ranking).toBe(1);

      // Student A (82) should be rank 2
      expect(batchResults[1].studentId).toBe('student-1');
      expect(batchResults[1].ranking).toBe(2);

      expect(prisma.reportCard.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rc-2' }, data: { ranking: 1 } }),
      );
      expect(prisma.reportCard.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'rc-1' }, data: { ranking: 2 } }),
      );
    });
  });

  describe('renderReportCardHtml', () => {
    it('should generate official printable HTML with dual curricula and attendance summary', async () => {
      jest.spyOn(service, 'findById').mockResolvedValue({
        id: 'rc-1',
        tenantId: mockTenantId,
        studentId: mockStudentId,
        studentName: 'Ahmad Dahlan',
        studentNis: '2026001',
        studentNisn: '0012345678',
        classGroupId: mockClassGroupId,
        classGroupName: '10 Diniyah Wustha',
        academicYearId: mockAcademicYearId,
        academicYearName: '2026/2027 Ganjil',
        semester: 'ODD',
        finalAverage: 88.5,
        overallPredicate: 'B',
        ranking: 3,
        totalStudentsInClass: 28,
        remarks: 'Prestasi belajar sangat memuaskan.',
        pdfUrl: '/api/v1/report-cards/rc-1/print',
        issuedAt: new Date().toISOString(),
        subjects: [
          {
            subjectId: 's1',
            subjectName: 'Bahasa Indonesia',
            subjectCode: 'BIN-10',
            curriculumType: 'FORMAL_NATIONAL',
            kkm: 75,
            dailyTaskScore: 85,
            quizScore: 80,
            midExamScore: 90,
            finalExamScore: 88,
            practicalScore: null,
            characterScore: null,
            finalScore: 86.7,
            predicate: 'B',
            isPassed: true,
            competencyDescription: 'Menguasai materi dengan baik.',
          },
          {
            subjectId: 's2',
            subjectName: 'Nahwu Al-Jurumiyyah',
            subjectCode: 'NHW-01',
            curriculumType: 'PESANTREN_DINIYAH',
            kkm: 75,
            dailyTaskScore: 95,
            quizScore: 90,
            midExamScore: 92,
            finalExamScore: 94,
            practicalScore: 95,
            characterScore: null,
            finalScore: 93.4,
            predicate: 'A',
            isPassed: true,
            competencyDescription: 'Mumtaz dalam penguasaan matan.',
          },
        ],
        attendanceSummary: {
          presentCount: 95,
          lateCount: 2,
          sickCount: 1,
          permissionCount: 2,
          absentCount: 0,
        },
      });

      const html = await service.renderReportCardHtml(mockTenantId, 'rc-1');

      expect(html).toContain('LAPORAN CAPAIAN HASIL BELAJAR SANTRI / SISWA');
      expect(html).toContain('Ahmad Dahlan');
      expect(html).toContain('Bahasa Indonesia');
      expect(html).toContain('Nahwu Al-Jurumiyyah');
      expect(html).toContain('Muatan Kurikulum Nasional');
      expect(html).toContain('Muatan Kurikulum Pesantren Diniyah');
      expect(html).toContain('Peringkat 3 dari 28 Santri');
      expect(html).toContain('95 Hari');
    });
  });
});
