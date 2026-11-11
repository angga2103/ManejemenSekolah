import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GradesService } from './grades.service';
import { AttendanceStatus } from '@edusaas/shared-types';
import {
  GenerateReportCardDto,
  GenerateBatchReportCardsDto,
  ReportCardResponseData,
  ReportCardFilterDto,
  ReportCardAttendanceSummary,
} from '@edusaas/api-contracts';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReportCardsService {
  private readonly logger = new Logger(ReportCardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly gradesService: GradesService,
  ) {}

  /**
   * Generate or recalculate a digital report card for a single student
   */
  async generateReportCard(
    tenantId: string,
    userId: string,
    dto: GenerateReportCardDto,
  ): Promise<ReportCardResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }

    const classGroup = await this.prisma.classGroup.findFirst({
      where: { id: dto.classGroupId, tenantId },
    });
    if (!classGroup) {
      throw new NotFoundException(`ClassGroup with ID ${dto.classGroupId} not found`);
    }

    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, tenantId },
    });
    if (!academicYear) {
      throw new NotFoundException(`AcademicYear with ID ${dto.academicYearId} not found`);
    }

    // 1. Calculate weighted scores across all subjects (Dual Curricula)
    const kkm = dto.kkm || 75;
    const subjects = await this.gradesService.calculateStudentSubjectScores(
      tenantId,
      dto.studentId,
      dto.academicYearId,
      kkm,
    );

    // 2. Compute final overall average score
    const totalScore = subjects.reduce((sum, s) => sum + s.finalScore, 0);
    const finalAverage = subjects.length > 0 ? Math.round((totalScore / subjects.length) * 100) / 100 : 0;
    const overallPredicate = this.gradesService.calculatePredicate(finalAverage);

    // 3. Compute Attendance Summary for this student during the academic year
    const attendanceSummary = await this.calculateAttendanceSummary(
      tenantId,
      dto.studentId,
      academicYear.startDate,
      academicYear.endDate,
    );

    // 4. Default remarks if not provided
    const remarks = dto.remarks || this.generateDefaultRemarks(finalAverage);

    // 5. Upsert ReportCard record in database
    const existing = await this.prisma.reportCard.findFirst({
      where: {
        tenantId,
        studentId: dto.studentId,
        academicYearId: dto.academicYearId,
        semester: dto.semester,
      },
    });

    let reportCard;
    if (existing) {
      reportCard = await this.prisma.reportCard.update({
        where: { id: existing.id },
        data: {
          classGroupId: dto.classGroupId,
          finalAverage: new Prisma.Decimal(finalAverage),
          remarks,
          pdfUrl: `/api/v1/report-cards/${existing.id}/print`,
        },
        include: {
          student: true,
          classGroup: true,
          academicYear: true,
        },
      });
    } else {
      reportCard = await this.prisma.reportCard.create({
        data: {
          tenantId,
          studentId: dto.studentId,
          classGroupId: dto.classGroupId,
          academicYearId: dto.academicYearId,
          semester: dto.semester,
          finalAverage: new Prisma.Decimal(finalAverage),
          remarks,
          pdfUrl: null, // will be updated with id
        },
        include: {
          student: true,
          classGroup: true,
          academicYear: true,
        },
      });

      // Set PDF print URL
      reportCard = await this.prisma.reportCard.update({
        where: { id: reportCard.id },
        data: { pdfUrl: `/api/v1/report-cards/${reportCard.id}/print` },
        include: {
          student: true,
          classGroup: true,
          academicYear: true,
        },
      });
    }

    // Total students in this class
    const totalStudentsInClass = await this.prisma.classStudent.count({
      where: { classGroupId: dto.classGroupId },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'REPORT_CARD_GENERATED',
      resource: 'report_cards',
      resourceId: reportCard.id,
      newValues: {
        studentId: dto.studentId,
        classGroupId: dto.classGroupId,
        academicYearId: dto.academicYearId,
        semester: dto.semester,
        finalAverage,
      },
    });

    return {
      id: reportCard.id,
      tenantId: reportCard.tenantId,
      studentId: reportCard.studentId,
      studentName: reportCard.student.fullName,
      studentNis: reportCard.student.nis,
      studentNisn: reportCard.student.nisn,
      classGroupId: reportCard.classGroupId,
      classGroupName: reportCard.classGroup.name,
      academicYearId: reportCard.academicYearId,
      academicYearName: reportCard.academicYear.name,
      semester: reportCard.semester,
      finalAverage: Number(reportCard.finalAverage),
      overallPredicate,
      ranking: reportCard.ranking,
      totalStudentsInClass,
      remarks: reportCard.remarks,
      pdfUrl: reportCard.pdfUrl,
      issuedAt: reportCard.issuedAt.toISOString(),
      subjects,
      attendanceSummary,
    };
  }

  /**
   * Batch generate report cards for all students in a class and calculate class rankings
   */
  async generateBatchReportCards(
    tenantId: string,
    userId: string,
    dto: GenerateBatchReportCardsDto,
  ): Promise<ReportCardResponseData[]> {
    const classGroup = await this.prisma.classGroup.findFirst({
      where: { id: dto.classGroupId, tenantId },
      include: {
        classStudents: {
          include: { student: true },
        },
      },
    });

    if (!classGroup) {
      throw new NotFoundException(`ClassGroup with ID ${dto.classGroupId} not found`);
    }

    if (classGroup.classStudents.length === 0) {
      throw new BadRequestException('ClassGroup has no enrolled students');
    }

    // 1. Generate individual report cards
    const results: ReportCardResponseData[] = [];
    for (const cs of classGroup.classStudents) {
      const rc = await this.generateReportCard(tenantId, userId, {
        studentId: cs.studentId,
        classGroupId: dto.classGroupId,
        academicYearId: dto.academicYearId,
        semester: dto.semester,
        kkm: dto.kkm,
      });
      results.push(rc);
    }

    // 2. Sort by finalAverage descending and compute ranking
    results.sort((a, b) => b.finalAverage - a.finalAverage);

    // 3. Assign rankings & update records in DB
    for (let i = 0; i < results.length; i++) {
      const rank = i + 1;
      results[i].ranking = rank;

      await this.prisma.reportCard.update({
        where: { id: results[i].id },
        data: { ranking: rank },
      });
    }

    await this.auditService.record({
      tenantId,
      userId,
      action: 'BATCH_REPORT_CARDS_GENERATED',
      resource: 'report_cards',
      newValues: {
        classGroupId: dto.classGroupId,
        academicYearId: dto.academicYearId,
        semester: dto.semester,
        count: results.length,
      },
    });

    return results;
  }

  /**
   * Find report cards with filters and role-based privacy scoping
   */
  async findAll(
    tenantId: string,
    filter: ReportCardFilterDto,
    guardianUserId?: string,
    studentUserId?: string,
  ): Promise<{ data: ReportCardResponseData[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    let allowedStudentIds: string[] | undefined = undefined;

    // Guardian Scoping
    if (guardianUserId) {
      const guardian = await this.prisma.guardian.findFirst({
        where: { userId: guardianUserId, tenantId },
        include: { students: true },
      });
      if (!guardian) {
        return { data: [], total: 0, page, limit };
      }
      allowedStudentIds = guardian.students.map((s) => s.studentId);
    }

    // Student Scoping
    if (studentUserId) {
      const student = await this.prisma.student.findFirst({
        where: { userId: studentUserId, tenantId },
      });
      if (!student) {
        return { data: [], total: 0, page, limit };
      }
      allowedStudentIds = [student.id];
    }

    const where: Prisma.ReportCardWhereInput = {
      tenantId,
      ...(filter.classGroupId && { classGroupId: filter.classGroupId }),
      ...(filter.academicYearId && { academicYearId: filter.academicYearId }),
      ...(filter.semester && { semester: filter.semester }),
      ...(filter.studentId && { studentId: filter.studentId }),
      ...(allowedStudentIds && { studentId: { in: allowedStudentIds } }),
    };

    const [reportCards, total] = await Promise.all([
      this.prisma.reportCard.findMany({
        where,
        include: {
          student: true,
          classGroup: true,
          academicYear: true,
        },
        orderBy: [{ finalAverage: 'desc' }, { student: { fullName: 'asc' } }],
        skip,
        take: limit,
      }),
      this.prisma.reportCard.count({ where }),
    ]);

    const data: ReportCardResponseData[] = [];
    for (const rc of reportCards) {
      const totalStudents = await this.prisma.classStudent.count({
        where: { classGroupId: rc.classGroupId },
      });
      const finalAvg = Number(rc.finalAverage);
      data.push({
        id: rc.id,
        tenantId: rc.tenantId,
        studentId: rc.studentId,
        studentName: rc.student.fullName,
        studentNis: rc.student.nis,
        studentNisn: rc.student.nisn,
        classGroupId: rc.classGroupId,
        classGroupName: rc.classGroup.name,
        academicYearId: rc.academicYearId,
        academicYearName: rc.academicYear.name,
        semester: rc.semester,
        finalAverage: finalAvg,
        overallPredicate: this.gradesService.calculatePredicate(finalAvg),
        ranking: rc.ranking,
        totalStudentsInClass: totalStudents,
        remarks: rc.remarks,
        pdfUrl: rc.pdfUrl,
        issuedAt: rc.issuedAt.toISOString(),
        subjects: [], // lightweight in list view
        attendanceSummary: {
          presentCount: 0,
          lateCount: 0,
          sickCount: 0,
          permissionCount: 0,
          absentCount: 0,
        },
      });
    }

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Find single report card with complete details
   */
  async findById(
    tenantId: string,
    id: string,
    guardianUserId?: string,
    studentUserId?: string,
  ): Promise<ReportCardResponseData> {
    const rc = await this.prisma.reportCard.findFirst({
      where: { id, tenantId },
      include: {
        student: true,
        classGroup: true,
        academicYear: true,
      },
    });

    if (!rc) {
      throw new NotFoundException(`Report card with ID ${id} not found`);
    }

    // Role-based privacy verification
    if (guardianUserId) {
      const isLinked = await this.prisma.studentGuardian.findFirst({
        where: {
          studentId: rc.studentId,
          guardian: { userId: guardianUserId },
        },
      });
      if (!isLinked) {
        throw new ForbiddenException('You do not have access to this report card');
      }
    }

    if (studentUserId && rc.student.userId !== studentUserId) {
      throw new ForbiddenException('You do not have access to this report card');
    }

    const subjects = await this.gradesService.calculateStudentSubjectScores(
      tenantId,
      rc.studentId,
      rc.academicYearId,
    );

    const attendanceSummary = await this.calculateAttendanceSummary(
      tenantId,
      rc.studentId,
      rc.academicYear.startDate,
      rc.academicYear.endDate,
    );

    const totalStudentsInClass = await this.prisma.classStudent.count({
      where: { classGroupId: rc.classGroupId },
    });

    const finalAvg = Number(rc.finalAverage);

    return {
      id: rc.id,
      tenantId: rc.tenantId,
      studentId: rc.studentId,
      studentName: rc.student.fullName,
      studentNis: rc.student.nis,
      studentNisn: rc.student.nisn,
      classGroupId: rc.classGroupId,
      classGroupName: rc.classGroup.name,
      academicYearId: rc.academicYearId,
      academicYearName: rc.academicYear.name,
      semester: rc.semester,
      finalAverage: finalAvg,
      overallPredicate: this.gradesService.calculatePredicate(finalAvg),
      ranking: rc.ranking,
      totalStudentsInClass,
      remarks: rc.remarks,
      pdfUrl: rc.pdfUrl,
      issuedAt: rc.issuedAt.toISOString(),
      subjects,
      attendanceSummary,
    };
  }

  /**
   * Render Printable HTML of Rapor Santri / Siswa Digital
   */
  async renderReportCardHtml(tenantId: string, id: string): Promise<string> {
    const reportCard = await this.findById(tenantId, id);
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    const formalSubjects = reportCard.subjects.filter(
      (s) => s.curriculumType !== 'PESANTREN_DINIYAH',
    );
    const pesantrenSubjects = reportCard.subjects.filter(
      (s) => s.curriculumType === 'PESANTREN_DINIYAH',
    );

    const institutionName = tenant?.name || 'PESANTREN & SEKOLAH TERPADU';

    return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Hasil Belajar (Rapor Digital) - ${reportCard.studentName}</title>
  <style>
    @page { size: A4 portrait; margin: 15mm 15mm 20mm 15mm; }
    body { font-family: 'Times New Roman', Times, serif; color: #111; line-height: 1.3; font-size: 11pt; margin: 0; padding: 0; }
    .header { text-align: center; border-bottom: 3px double #000; padding-bottom: 8px; margin-bottom: 15px; }
    .header h2 { margin: 0; font-size: 14pt; text-transform: uppercase; letter-spacing: 0.5px; }
    .header h1 { margin: 4px 0; font-size: 16pt; font-weight: bold; text-transform: uppercase; }
    .header p { margin: 2px 0; font-size: 9pt; color: #444; }
    .info-table { width: 100%; margin-bottom: 12px; font-size: 10pt; }
    .info-table td { padding: 3px 4px; vertical-align: top; }
    .section-title { font-weight: bold; font-size: 11pt; margin: 14px 0 6px 0; text-transform: uppercase; border-left: 4px solid #1e3a8a; padding-left: 6px; }
    table.data-table { width: 100%; border-collapse: collapse; margin-bottom: 12px; font-size: 9.5pt; }
    table.data-table th, table.data-table td { border: 1px solid #333; padding: 5px 6px; text-align: left; }
    table.data-table th { background-color: #f1f5f9; text-align: center; font-weight: bold; }
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    .summary-box { border: 1px solid #333; padding: 8px; margin-top: 10px; background-color: #fafafa; }
    .signatures { width: 100%; margin-top: 25px; page-break-inside: avoid; }
    .signatures td { text-align: center; vertical-align: top; width: 33%; font-size: 10pt; }
    .signature-space { height: 60px; }
    .digital-seal { border: 2px dashed #059669; color: #059669; font-size: 8pt; display: inline-block; padding: 3px 8px; border-radius: 4px; margin-top: 4px; }
    @media print {
      .no-print { display: none; }
      body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="no-print" style="background: #eff6ff; border: 1px solid #bfdbfe; padding: 10px; margin-bottom: 15px; border-radius: 6px; text-align: right;">
    <button onclick="window.print()" style="background: #1e40af; color: white; border: none; padding: 8px 16px; border-radius: 4px; font-weight: bold; cursor: pointer;">
      🖨️ Cetak / Simpan PDF
    </button>
  </div>

  <div class="header">
    <h2>LAPORAN CAPAIAN HASIL BELAJAR SANTRI / SISWA</h2>
    <h1>${institutionName}</h1>
    <p>Sistem Informasi Manajemen Terpadu Pendidikan & Kepesantrenan Modern</p>
  </div>

  <table class="info-table">
    <tr>
      <td width="18%"><strong>Nama Santri/Siswa</strong></td>
      <td width="32%">: ${reportCard.studentName}</td>
      <td width="18%"><strong>Kelas / Rombel</strong></td>
      <td width="32%">: ${reportCard.classGroupName}</td>
    </tr>
    <tr>
      <td><strong>Nomor Induk (NIS)</strong></td>
      <td>: ${reportCard.studentNis}</td>
      <td><strong>Tahun Ajaran</strong></td>
      <td>: ${reportCard.academicYearName}</td>
    </tr>
    <tr>
      <td><strong>NISN</strong></td>
      <td>: ${reportCard.studentNisn || '-'}</td>
      <td><strong>Semester</strong></td>
      <td>: ${reportCard.semester}</td>
    </tr>
  </table>

  <!-- KELOMPOK 1: MUATAN KURIKULUM NASIONAL -->
  <div class="section-title">A. Muatan Kurikulum Nasional (Kemendikbudristek / Kemenag)</div>
  <table class="data-table">
    <thead>
      <tr>
        <th width="5%">No</th>
        <th width="30%">Mata Pelajaran</th>
        <th width="8%">KKM</th>
        <th width="10%">Nilai Akhir</th>
        <th width="8%">Predikat</th>
        <th width="39%">Capaian Kompetensi</th>
      </tr>
    </thead>
    <tbody>
      ${
        formalSubjects.length > 0
          ? formalSubjects
              .map(
                (sub, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><strong>${sub.subjectName}</strong> (${sub.subjectCode})</td>
          <td class="text-center">${sub.kkm}</td>
          <td class="text-center"><strong>${sub.finalScore}</strong></td>
          <td class="text-center font-bold">${sub.predicate}</td>
          <td style="font-size: 8.5pt;">${sub.competencyDescription}</td>
        </tr>`,
              )
              .join('')
          : '<tr><td colspan="6" class="text-center">Tidak ada mata pelajaran formal terdaftar</td></tr>'
      }
    </tbody>
  </table>

  <!-- KELOMPOK 2: MUATAN KEPESANTRENAN / DINIYAH -->
  <div class="section-title">B. Muatan Kurikulum Pesantren Diniyah & Kajian Kitab Kuning</div>
  <table class="data-table">
    <thead>
      <tr>
        <th width="5%">No</th>
        <th width="30%">Kajian Kitab / Materi</th>
        <th width="8%">KKM</th>
        <th width="10%">Nilai Akhir</th>
        <th width="8%">Predikat</th>
        <th width="39%">Capaian Sorogan, Bandongan & Adab Santri</th>
      </tr>
    </thead>
    <tbody>
      ${
        pesantrenSubjects.length > 0
          ? pesantrenSubjects
              .map(
                (sub, idx) => `
        <tr>
          <td class="text-center">${idx + 1}</td>
          <td><strong>${sub.subjectName}</strong> (${sub.subjectCode})</td>
          <td class="text-center">${sub.kkm}</td>
          <td class="text-center"><strong>${sub.finalScore}</strong></td>
          <td class="text-center font-bold">${sub.predicate}</td>
          <td style="font-size: 8.5pt;">${sub.competencyDescription}</td>
        </tr>`,
              )
              .join('')
          : '<tr><td colspan="6" class="text-center">Tidak ada muatan pesantren diniyah terdaftar</td></tr>'
      }
    </tbody>
  </table>

  <!-- REKAPITULASI PRESTASI & KEHADIRAN -->
  <table style="width: 100%; margin-top: 10px;">
    <tr>
      <td style="width: 50%; vertical-align: top; padding-right: 10px;">
        <div class="section-title">C. Rekapitulasi Nilai & Peringkat</div>
        <table class="data-table">
          <tr>
            <td><strong>Nilai Rata-rata Kumulatif</strong></td>
            <td class="text-center"><strong>${reportCard.finalAverage}</strong></td>
          </tr>
          <tr>
            <td><strong>Predikat Kelulusan Keseluruhan</strong></td>
            <td class="text-center"><strong>${reportCard.overallPredicate}</strong></td>
          </tr>
          <tr>
            <td><strong>Peringkat di Kelas</strong></td>
            <td class="text-center"><strong>Peringkat ${reportCard.ranking || '-'} dari ${reportCard.totalStudentsInClass} Santri</strong></td>
          </tr>
        </table>
      </td>
      <td style="width: 50%; vertical-align: top; padding-left: 10px;">
        <div class="section-title">D. Rekapitulasi Presensi Santri</div>
        <table class="data-table">
          <tr>
            <td>Hadir Tepat Waktu</td>
            <td class="text-center">${reportCard.attendanceSummary.presentCount} Hari</td>
          </tr>
          <tr>
            <td>Terlambat Masuk</td>
            <td class="text-center">${reportCard.attendanceSummary.lateCount} Kali</td>
          </tr>
          <tr>
            <td>Sakit (Surat Dokter)</td>
            <td class="text-center">${reportCard.attendanceSummary.sickCount} Hari</td>
          </tr>
          <tr>
            <td>Izin Pulang / Syar'i</td>
            <td class="text-center">${reportCard.attendanceSummary.permissionCount} Hari</td>
          </tr>
          <tr>
            <td>Tanpa Keterangan (Alpa)</td>
            <td class="text-center">${reportCard.attendanceSummary.absentCount} Hari</td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <!-- CATATAN WALI KELAS -->
  <div class="section-title">E. Catatan & Bimbingan Wali Kelas / Musyrif</div>
  <div class="summary-box">
    <em>"${reportCard.remarks}"</em>
  </div>

  <!-- TANDA TANGAN -->
  <table class="signatures">
    <tr>
      <td>
        Mengetahui,<br>Orang Tua / Wali Santri
        <div class="signature-space"></div>
        ( .................................................. )
      </td>
      <td>
        Wali Kelas / Asatidz Pendamping
        <div class="signature-space"></div>
        <strong>Ustaz Pengasuh Rombel</strong><br>
        <span class="digital-seal">✓ TERVERIFIKASI SISTEM</span>
      </td>
      <td>
        Kepala Satuan Pendidikan / Pengasuh Pesantren
        <div class="signature-space"></div>
        <strong>K.H. Pimpinan Pesantren</strong><br>
        <span class="digital-seal">✓ RESMI DIGITAL SAAS</span>
      </td>
    </tr>
  </table>
</body>
</html>
    `;
  }

  private async calculateAttendanceSummary(
    tenantId: string,
    studentId: string,
    startDate: Date,
    endDate: Date,
  ): Promise<ReportCardAttendanceSummary> {
    const attendances = await this.prisma.attendance.findMany({
      where: {
        tenantId,
        studentId,
        recordedDate: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    let presentCount = 0;
    let lateCount = 0;
    let sickCount = 0;
    let permissionCount = 0;
    let absentCount = 0;

    for (const a of attendances) {
      switch (a.status) {
        case AttendanceStatus.PRESENT:
          presentCount++;
          break;
        case AttendanceStatus.LATE:
          lateCount++;
          break;
        case AttendanceStatus.SICK:
          sickCount++;
          break;
        case AttendanceStatus.PERMISSION:
          permissionCount++;
          break;
        case AttendanceStatus.ABSENT:
          absentCount++;
          break;
      }
    }

    return {
      presentCount,
      lateCount,
      sickCount,
      permissionCount,
      absentCount,
    };
  }

  private generateDefaultRemarks(average: number): string {
    if (average >= 90) {
      return "Alhamdulillah, capaian prestasi ananda sangat istimewa (Mumtaz) baik dalam materi kurikulum nasional maupun kajian kitab diniyah. Terus istiqamah dan jaga adab thalabul ilmi.";
    } else if (average >= 80) {
      return 'Ananda menunjukkan kemajuan belajar dan kedisiplinan yang sangat baik. Tingkatkan lagi pemahaman tafaqquh fiddin dan ketertiban murajaah mandiri.';
    } else if (average >= 70) {
      return 'Capaian ananda sudah cukup baik dan memenuhi KKM. Perlu lebih tekun dan aktif dalam kegiatan sorogan serta evaluasi tugas harian.';
    } else {
      return 'Ananda memerlukan perhatian dan bimbingan belajar tambahan. Diharapkan kerja sama yang erat antara asatidz pembimbing dan orang tua di rumah.';
    }
  }
}
