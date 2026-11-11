import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentFilterQueryDto,
  StudentResponseData,
  StudentBatchImportItem,
  StudentBatchImportResult,
} from '@edusaas/api-contracts';
import { StudentStatus, Gender, GuardianRelationshipType } from '@edusaas/shared-types';

@Injectable()
export class StudentsService {
  private readonly logger = new Logger(StudentsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * List students with filtering, search, and pagination
   */
  async listStudents(
    tenantId: string,
    query: StudentFilterQueryDto = {},
  ): Promise<{ data: StudentResponseData[]; meta: { total: number; page: number; limit: number } }> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {
      tenantId,
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.gender) {
      where.gender = query.gender;
    }

    if (query.classGroupId) {
      where.classStudents = {
        some: { classGroupId: query.classGroupId },
      };
    }

    if (query.search && query.search.trim()) {
      const s = query.search.trim();
      where.OR = [
        { fullName: { contains: s, mode: 'insensitive' } },
        { nis: { contains: s, mode: 'insensitive' } },
        { nisn: { contains: s, mode: 'insensitive' } },
      ];
    }

    const [total, students] = await Promise.all([
      this.prisma.student.count({ where }),
      this.prisma.student.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ fullName: 'asc' }],
        include: {
          classStudents: {
            take: 1,
            include: {
              classGroup: true,
            },
          },
          _count: {
            select: { guardians: true },
          },
        },
      }),
    ]);

    const mapped = students.map((s) => {
      const currentClass = s.classStudents[0]?.classGroup;
      return {
        id: s.id,
        tenantId: s.tenantId,
        userId: s.userId,
        nis: s.nis,
        nisn: s.nisn,
        nik: s.nik,
        fullName: s.fullName,
        gender: s.gender as unknown as Gender,
        birthPlace: s.birthPlace,
        birthDate: s.birthDate,
        status: s.status as unknown as StudentStatus,
        admissionYear: s.admissionYear,
        currentClass: currentClass
          ? {
              id: currentClass.id,
              name: currentClass.name,
              gradeLevel: currentClass.gradeLevel,
            }
          : null,
        guardiansCount: s._count.guardians,
        createdAt: s.createdAt,
        updatedAt: s.updatedAt,
      };
    });

    return {
      data: mapped,
      meta: { total, page, limit },
    };
  }

  /**
   * Get single student by ID with class, guardians, and status
   */
  async getStudentById(tenantId: string, id: string): Promise<any> {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId, deletedAt: null },
      include: {
        classStudents: {
          include: {
            classGroup: true,
          },
        },
        guardians: {
          include: {
            guardian: true,
          },
        },
      },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    const currentClass = student.classStudents[0]?.classGroup;

    return {
      id: student.id,
      tenantId: student.tenantId,
      userId: student.userId,
      nis: student.nis,
      nisn: student.nisn,
      nik: student.nik,
      fullName: student.fullName,
      gender: student.gender,
      birthPlace: student.birthPlace,
      birthDate: student.birthDate,
      status: student.status,
      admissionYear: student.admissionYear,
      currentClass: currentClass
        ? {
            id: currentClass.id,
            name: currentClass.name,
            gradeLevel: currentClass.gradeLevel,
          }
        : null,
      guardians: student.guardians.map((g) => ({
        id: g.id,
        guardianId: g.guardianId,
        fullName: g.guardian.fullName,
        phone: g.guardian.phone,
        email: (g.guardian as any).user?.email || null,
        relationshipType: g.relationshipType,
        isPrimary: g.isPrimary,
        hasFinancialAccess: g.hasFinancialAccess,
        isEmergencyContact: g.isEmergencyContact,
        receivePush: g.receivePush,
        receiveWhatsapp: g.receiveWhatsapp,
      })),
      createdAt: student.createdAt,
      updatedAt: student.updatedAt,
    };
  }

  /**
   * Create a new student within active tenant
   */
  async createStudent(
    tenantId: string,
    dto: CreateStudentDto,
    authorUserId?: string,
  ): Promise<StudentResponseData> {
    // Check NIS uniqueness in tenant
    const existing = await this.prisma.student.findFirst({
      where: { tenantId, nis: dto.nis.trim() },
    });

    if (existing) {
      throw new ConflictException(`Student with NIS '${dto.nis}' already exists in institution`);
    }

    const created = await this.prisma.$transaction(async (tx) => {
      const student = await tx.student.create({
        data: {
          tenantId,
          nis: dto.nis.trim(),
          nisn: dto.nisn?.trim(),
          nik: dto.nik?.trim(),
          fullName: dto.fullName.trim(),
          gender: dto.gender as any,
          birthPlace: dto.birthPlace.trim(),
          birthDate: new Date(dto.birthDate),
          admissionYear: dto.admissionYear,
          status: (dto.status || StudentStatus.ACTIVE) as any,
        },
      });

      if (dto.classGroupId) {
        await tx.classStudent.create({
          data: {
            classGroupId: dto.classGroupId,
            studentId: student.id,
          },
        });
      }

      return student;
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'STUDENT_CREATED',
      resource: 'Student',
      resourceId: created.id,
      newValues: { nis: created.nis, fullName: created.fullName },
    });

    return this.getStudentById(tenantId, created.id);
  }

  /**
   * Update student master record
   */
  async updateStudent(
    tenantId: string,
    id: string,
    dto: UpdateStudentDto,
    authorUserId?: string,
  ): Promise<StudentResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    if (dto.nis && dto.nis.trim() !== student.nis) {
      const existing = await this.prisma.student.findFirst({
        where: { tenantId, nis: dto.nis.trim(), id: { not: id } },
      });
      if (existing) {
        throw new ConflictException(`NIS '${dto.nis}' is already assigned to another student`);
      }
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.student.update({
        where: { id },
        data: {
          nis: dto.nis?.trim() || student.nis,
          nisn: dto.nisn !== undefined ? dto.nisn?.trim() : student.nisn,
          nik: dto.nik !== undefined ? dto.nik?.trim() : student.nik,
          fullName: dto.fullName?.trim() || student.fullName,
          gender: dto.gender ? (dto.gender as any) : student.gender,
          birthPlace: dto.birthPlace?.trim() || student.birthPlace,
          birthDate: dto.birthDate ? new Date(dto.birthDate) : student.birthDate,
          admissionYear: dto.admissionYear || student.admissionYear,
          status: dto.status ? (dto.status as any) : student.status,
        },
      });

      if (dto.classGroupId) {
        await tx.classStudent.deleteMany({
          where: { studentId: id },
        });
        await tx.classStudent.create({
          data: {
            classGroupId: dto.classGroupId,
            studentId: id,
          },
        });
      }
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'STUDENT_UPDATED',
      resource: 'Student',
      resourceId: id,
      newValues: dto as any,
    });

    return this.getStudentById(tenantId, id);
  }

  /**
   * Soft delete student
   */
  async deleteStudent(tenantId: string, id: string, authorUserId?: string) {
    const student = await this.prisma.student.findFirst({
      where: { id, tenantId, deletedAt: null },
    });

    if (!student) {
      throw new NotFoundException(`Student with ID '${id}' not found`);
    }

    await this.prisma.student.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'STUDENT_DELETED',
      resource: 'Student',
      resourceId: id,
    });

    return { message: 'Student successfully deleted' };
  }

  /**
   * Batch import students from Excel / tabular JSON
   */
  async batchImport(
    tenantId: string,
    items: StudentBatchImportItem[],
    authorUserId?: string,
  ): Promise<StudentBatchImportResult> {
    if (!items || items.length === 0) {
      throw new BadRequestException('Import item list cannot be empty');
    }

    const result: StudentBatchImportResult = {
      totalProcessed: items.length,
      successCount: 0,
      failedCount: 0,
      errors: [],
    };

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const row = i + 1;

      try {
        if (!item.nis || !item.fullName || !item.gender || !item.birthDate) {
          result.failedCount++;
          result.errors.push({
            row,
            nis: item.nis || 'N/A',
            reason: 'NIS, Full Name, Gender, and Birth Date are mandatory fields',
          });
          continue;
        }

        const existing = await this.prisma.student.findFirst({
          where: { tenantId, nis: item.nis.trim() },
        });

        if (existing) {
          result.failedCount++;
          result.errors.push({
            row,
            nis: item.nis,
            reason: `Duplicate NIS '${item.nis}'`,
          });
          continue;
        }

        await this.prisma.student.create({
          data: {
            tenantId,
            nis: item.nis.trim(),
            nisn: item.nisn?.trim(),
            nik: item.nik?.trim(),
            fullName: item.fullName.trim(),
            gender: (item.gender.toUpperCase() === 'FEMALE' ? Gender.FEMALE : Gender.MALE) as any,
            birthPlace: item.birthPlace || '-',
            birthDate: new Date(item.birthDate),
            admissionYear: item.admissionYear || new Date().getFullYear(),
            status: StudentStatus.ACTIVE as any,
          },
        });

        result.successCount++;
      } catch (err: any) {
        result.failedCount++;
        result.errors.push({
          row,
          nis: item.nis || 'N/A',
          reason: err.message || 'Database insertion error',
        });
      }
    }

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'STUDENTS_BATCH_IMPORTED',
      resource: 'Student',
      newValues: {
        total: result.totalProcessed,
        success: result.successCount,
        failed: result.failedCount,
      },
    });

    return result;
  }

  /**
   * Export students to CSV formatted string
   */
  async exportCsv(tenantId: string, classGroupId?: string): Promise<string> {
    const studentsRes = await this.listStudents(tenantId, {
      classGroupId,
      limit: 1000,
    });

    const headers = [
      'ID',
      'NIS',
      'NISN',
      'NIK',
      'Nama Lengkap',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Tahun Masuk',
      'Status',
      'Kelas',
    ];

    const rows = studentsRes.data.map((s) => [
      s.id,
      s.nis,
      s.nisn || '',
      s.nik || '',
      `"${s.fullName.replace(/"/g, '""')}"`,
      s.gender,
      `"${s.birthPlace.replace(/"/g, '""')}"`,
      typeof s.birthDate === 'string' ? s.birthDate.split('T')[0] : s.birthDate.toISOString().split('T')[0],
      s.admissionYear,
      s.status,
      s.currentClass ? `"${s.currentClass.name}"` : '',
    ]);

    return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }
}
