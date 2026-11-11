import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { GradeComponent, CurriculumType } from '@edusaas/shared-types';
import {
  CreateGradeDto,
  BatchInputGradesDto,
  GradeFilterDto,
  GradeResponseData,
  SubjectScoreSummaryDto,
} from '@edusaas/api-contracts';
import { Prisma } from '@prisma/client';

@Injectable()
export class GradesService {
  private readonly logger = new Logger(GradesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  /**
   * Record or update a single grade for a student
   */
  async recordGrade(
    tenantId: string,
    userId: string,
    dto: CreateGradeDto,
  ): Promise<GradeResponseData> {
    if (dto.score < 0 || dto.score > 100) {
      throw new BadRequestException('Score must be between 0 and 100');
    }

    // Verify student belongs to tenant
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${dto.studentId} not found`);
    }

    // Verify subject belongs to tenant
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, tenantId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${dto.subjectId} not found`);
    }

    // Verify academic year belongs to tenant
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, tenantId },
    });
    if (!academicYear) {
      throw new NotFoundException(`Academic Year with ID ${dto.academicYearId} not found`);
    }

    const weight = dto.weight !== undefined && dto.weight > 0 ? dto.weight : 1.0;

    // Check if grade already exists for this component in this academic year
    const existingGrade = await this.prisma.grade.findFirst({
      where: {
        tenantId,
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        academicYearId: dto.academicYearId,
        component: dto.component,
      },
    });

    let gradeRecord;
    if (existingGrade) {
      gradeRecord = await this.prisma.grade.update({
        where: { id: existingGrade.id },
        data: {
          score: new Prisma.Decimal(dto.score),
          weight: new Prisma.Decimal(weight),
          notes: dto.notes ?? null,
        },
        include: {
          student: true,
          subject: true,
          academicYear: true,
        },
      });
    } else {
      gradeRecord = await this.prisma.grade.create({
        data: {
          tenantId,
          studentId: dto.studentId,
          subjectId: dto.subjectId,
          academicYearId: dto.academicYearId,
          component: dto.component,
          score: new Prisma.Decimal(dto.score),
          weight: new Prisma.Decimal(weight),
          notes: dto.notes ?? null,
        },
        include: {
          student: true,
          subject: true,
          academicYear: true,
        },
      });
    }

    await this.auditService.record({
      tenantId,
      userId,
      action: 'GRADE_RECORDED',
      resource: 'grades',
      resourceId: gradeRecord.id,
      newValues: {
        studentId: dto.studentId,
        subjectId: dto.subjectId,
        component: dto.component,
        score: dto.score,
        weight,
      },
    });

    return this.mapToResponse(gradeRecord);
  }

  /**
   * Batch input grades for an entire class roster
   */
  async batchInputGrades(
    tenantId: string,
    userId: string,
    dto: BatchInputGradesDto,
  ): Promise<{ count: number; grades: GradeResponseData[] }> {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('At least one grade item must be provided');
    }

    // Verify class group
    const classGroup = await this.prisma.classGroup.findFirst({
      where: { id: dto.classGroupId, tenantId },
    });
    if (!classGroup) {
      throw new NotFoundException(`ClassGroup with ID ${dto.classGroupId} not found`);
    }

    // Verify subject
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, tenantId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${dto.subjectId} not found`);
    }

    // Verify academic year
    const academicYear = await this.prisma.academicYear.findFirst({
      where: { id: dto.academicYearId, tenantId },
    });
    if (!academicYear) {
      throw new NotFoundException(`Academic Year with ID ${dto.academicYearId} not found`);
    }

    const weight = dto.weight !== undefined && dto.weight > 0 ? dto.weight : 1.0;
    const results: GradeResponseData[] = [];

    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        if (item.score < 0 || item.score > 100) {
          throw new BadRequestException(`Score for student ${item.studentId} must be between 0 and 100`);
        }

        const existing = await tx.grade.findFirst({
          where: {
            tenantId,
            studentId: item.studentId,
            subjectId: dto.subjectId,
            academicYearId: dto.academicYearId,
            component: dto.component,
          },
        });

        let saved;
        if (existing) {
          saved = await tx.grade.update({
            where: { id: existing.id },
            data: {
              score: new Prisma.Decimal(item.score),
              weight: new Prisma.Decimal(weight),
              notes: item.notes ?? null,
            },
            include: {
              student: true,
              subject: true,
              academicYear: true,
            },
          });
        } else {
          saved = await tx.grade.create({
            data: {
              tenantId,
              studentId: item.studentId,
              subjectId: dto.subjectId,
              academicYearId: dto.academicYearId,
              component: dto.component,
              score: new Prisma.Decimal(item.score),
              weight: new Prisma.Decimal(weight),
              notes: item.notes ?? null,
            },
            include: {
              student: true,
              subject: true,
              academicYear: true,
            },
          });
        }

        results.push(this.mapToResponse(saved));
      }
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'BATCH_GRADES_RECORDED',
      resource: 'grades',
      newValues: {
        classGroupId: dto.classGroupId,
        subjectId: dto.subjectId,
        component: dto.component,
        count: results.length,
      },
    });

    return {
      count: results.length,
      grades: results,
    };
  }

  /**
   * Query grades with optional filters
   */
  async findAll(
    tenantId: string,
    filter: GradeFilterDto,
  ): Promise<{ data: GradeResponseData[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    const where: Prisma.GradeWhereInput = {
      tenantId,
      ...(filter.studentId && { studentId: filter.studentId }),
      ...(filter.subjectId && { subjectId: filter.subjectId }),
      ...(filter.academicYearId && { academicYearId: filter.academicYearId }),
      ...(filter.component && { component: filter.component }),
      ...(filter.classGroupId && {
        student: {
          classStudents: {
            some: { classGroupId: filter.classGroupId },
          },
        },
      }),
    };

    const [grades, total] = await Promise.all([
      this.prisma.grade.findMany({
        where,
        include: {
          student: true,
          subject: true,
          academicYear: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.grade.count({ where }),
    ]);

    return {
      data: grades.map((g) => this.mapToResponse(g)),
      total,
      page,
      limit,
    };
  }

  /**
   * Calculate student weighted scores across all subjects for an academic year
   * Supports Dual Curricula (FORMAL_NATIONAL and PESANTREN_DINIYAH)
   */
  async calculateStudentSubjectScores(
    tenantId: string,
    studentId: string,
    academicYearId: string,
    customKkm = 75,
  ): Promise<SubjectScoreSummaryDto[]> {
    const student = await this.prisma.student.findFirst({
      where: { id: studentId, tenantId },
      include: {
        classStudents: {
          include: { classGroup: true },
        },
      },
    });
    if (!student) {
      throw new NotFoundException(`Student with ID ${studentId} not found`);
    }

    const institutionId = student.classStudents?.[0]?.classGroup?.institutionId;

    // Get subjects for this student's institution or tenant
    const subjects = await this.prisma.subject.findMany({
      where: {
        tenantId,
        ...(institutionId ? { institutionId } : {}),
      },
      orderBy: [{ curriculumType: 'asc' }, { name: 'asc' }],
    });

    // Get all grades recorded for this student in this academic year
    const grades = await this.prisma.grade.findMany({
      where: {
        tenantId,
        studentId,
        academicYearId,
      },
    });

    const summaries: SubjectScoreSummaryDto[] = [];

    for (const sub of subjects) {
      const subjectGrades = grades.filter((g) => g.subjectId === sub.id);
      const isPesantren = sub.curriculumType === CurriculumType.PESANTREN_DINIYAH;

      let dailyTask: number | null = null;
      let quiz: number | null = null;
      let midExam: number | null = null;
      let finalExam: number | null = null;
      let practical: number | null = null;
      let character: number | null = null;

      for (const g of subjectGrades) {
        const val = Number(g.score);
        switch (g.component) {
          case GradeComponent.DAILY_TASK:
            dailyTask = val;
            break;
          case GradeComponent.QUIZ:
            quiz = val;
            break;
          case GradeComponent.MID_EXAM:
            midExam = val;
            break;
          case GradeComponent.FINAL_EXAM:
            finalExam = val;
            break;
          case GradeComponent.PRACTICAL:
            practical = val;
            break;
          case GradeComponent.CHARACTER_ATTITUDE:
            character = val;
            break;
        }
      }

      // Compute weighted score
      let totalWeightedScore = 0;
      let totalWeight = 0;

      if (isPesantren) {
        // Pesantren Diniyah default weights:
        // Daily / Setoran (20%), Practical / Sorogan (20%), Quiz / Lisan (15%), Mid (20%), Final (25%)
        if (dailyTask !== null) {
          totalWeightedScore += dailyTask * 0.2;
          totalWeight += 0.2;
        }
        if (practical !== null) {
          totalWeightedScore += practical * 0.2;
          totalWeight += 0.2;
        }
        if (quiz !== null) {
          totalWeightedScore += quiz * 0.15;
          totalWeight += 0.15;
        }
        if (midExam !== null) {
          totalWeightedScore += midExam * 0.2;
          totalWeight += 0.2;
        }
        if (finalExam !== null) {
          totalWeightedScore += finalExam * 0.25;
          totalWeight += 0.25;
        }
      } else {
        // Formal National default weights:
        // Daily Task (20%), Quiz (15%), Mid Exam (25%), Final Exam (40%)
        if (dailyTask !== null) {
          totalWeightedScore += dailyTask * 0.2;
          totalWeight += 0.2;
        }
        if (quiz !== null) {
          totalWeightedScore += quiz * 0.15;
          totalWeight += 0.15;
        }
        if (midExam !== null) {
          totalWeightedScore += midExam * 0.25;
          totalWeight += 0.25;
        }
        if (finalExam !== null) {
          totalWeightedScore += finalExam * 0.4;
          totalWeight += 0.4;
        }
      }

      const finalScore = totalWeight > 0 ? Math.round((totalWeightedScore / totalWeight) * 100) / 100 : 0;
      const predicate = this.calculatePredicate(finalScore);
      const isPassed = finalScore >= customKkm;
      const competencyDescription = this.generateCompetencyDescription(
        sub.name,
        sub.curriculumType,
        predicate,
      );

      summaries.push({
        subjectId: sub.id,
        subjectName: sub.name,
        subjectCode: sub.code,
        curriculumType: sub.curriculumType,
        kkm: customKkm,
        dailyTaskScore: dailyTask,
        quizScore: quiz,
        midExamScore: midExam,
        finalExamScore: finalExam,
        practicalScore: practical,
        characterScore: character,
        finalScore,
        predicate,
        isPassed,
        competencyDescription,
      });
    }

    return summaries;
  }

  /**
   * Predicate calculation:
   * A: >= 90 (Mumtaz / Sangat Baik)
   * B: >= 80 (Jayyid Jiddan / Baik)
   * C: >= 70 (Jayyid / Cukup)
   * D: < 70  (Rasib / Perlu Bimbingan)
   */
  calculatePredicate(score: number): 'A' | 'B' | 'C' | 'D' {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 70) return 'C';
    return 'D';
  }

  /**
   * Generates tailored Indonesian narrative descriptions for report cards
   */
  generateCompetencyDescription(
    subjectName: string,
    curriculumType: string,
    predicate: 'A' | 'B' | 'C' | 'D',
  ): string {
    const isPesantren = curriculumType === CurriculumType.PESANTREN_DINIYAH;

    if (isPesantren) {
      switch (predicate) {
        case 'A':
          return `Mumtaz (Istimewa). Memiliki penguasaan kitab ${subjectName} yang sangat mendalam, fasih dalam membaca matan, tartil, dan konsisten berakhlakul karimah.`;
        case 'B':
          return `Jayyid Jiddan (Sangat Baik). Memahami kaidah dan kandungan kitab ${subjectName} dengan baik serta aktif dalam halaqah sorogan.`;
        case 'C':
          return `Jayyid (Cukup). Cukup mampu mengikuti pengajian kitab ${subjectName}, perlu meningkatkan ketelitian dan istiqamah dalam muthala'ah mandiri.`;
        case 'D':
          return `Perlu Pendampingan. Memerlukan bimbingan intensif dari ustaz pembimbing dalam memahami dasar-dasar kitab ${subjectName}.`;
      }
    } else {
      switch (predicate) {
        case 'A':
          return `Sangat baik. Memiliki penguasaan materi ${subjectName} yang istimewa, berpikir kritis, serta mampu menyelesaikan persoalan analitis dengan sangat baik.`;
        case 'B':
          return `Baik. Menguasai capaian pembelajaran mata pelajaran ${subjectName} dengan baik dan konsisten dalam menyelesaikan tugas serta evaluasi.`;
        case 'C':
          return `Cukup. Cukup menguasai kompetensi dasar ${subjectName}, disarankan untuk memperbanyak latihan soal dan penguatan konsep.`;
        case 'D':
          return `Perlu bimbingan. Membutuhkan pendampingan guru dan perhatian orang tua dalam mencapai ketuntasan kompetensi mata pelajaran ${subjectName}.`;
      }
    }
  }

  private mapToResponse(grade: any): GradeResponseData {
    return {
      id: grade.id,
      tenantId: grade.tenantId,
      studentId: grade.studentId,
      studentName: grade.student?.fullName,
      studentNis: grade.student?.nis,
      subjectId: grade.subjectId,
      subjectName: grade.subject?.name,
      subjectCode: grade.subject?.code,
      curriculumType: grade.subject?.curriculumType,
      academicYearId: grade.academicYearId,
      academicYearName: grade.academicYear?.name,
      component: grade.component,
      score: Number(grade.score),
      weight: Number(grade.weight),
      notes: grade.notes,
      createdAt: grade.createdAt.toISOString(),
      updatedAt: grade.updatedAt.toISOString(),
    };
  }
}
