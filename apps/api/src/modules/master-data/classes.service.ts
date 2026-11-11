import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateClassGroupDto,
  UpdateClassGroupDto,
  ClassGroupResponseData,
  AssignStudentToClassDto,
} from '@edusaas/api-contracts';

@Injectable()
export class ClassesService {
  private readonly logger = new Logger(ClassesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * List all classes in tenant, optionally filtered by academic year
   */
  async listClasses(
    tenantId: string,
    academicYearId?: string,
  ): Promise<ClassGroupResponseData[]> {
    const where: any = { tenantId };
    if (academicYearId) {
      where.academicYearId = academicYearId;
    }

    const classes = await this.prisma.classGroup.findMany({
      where,
      orderBy: [{ gradeLevel: 'asc' }, { name: 'asc' }],
      include: {
        homeroomTeacher: true,
        _count: {
          select: { classStudents: true },
        },
      },
    });

    return classes.map((c) => ({
      id: c.id,
      tenantId: c.tenantId,
      institutionId: c.institutionId,
      academicYearId: c.academicYearId,
      name: c.name,
      gradeLevel: c.gradeLevel,
      homeroomTeacherId: c.homeroomTeacherId,
      homeroomTeacherName: c.homeroomTeacher?.fullName || null,
      studentCount: c._count.classStudents,
      createdAt: c.createdAt,
    }));
  }

  /**
   * Get class by ID with enrolled students
   */
  async getClassById(tenantId: string, id: string): Promise<any> {
    const cls = await this.prisma.classGroup.findFirst({
      where: { id, tenantId },
      include: {
        institution: true,
        academicYear: true,
        homeroomTeacher: true,
        classStudents: {
          include: {
            student: true,
          },
          orderBy: {
            student: { fullName: 'asc' },
          },
        },
      },
    });

    if (!cls) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }

    return {
      id: cls.id,
      tenantId: cls.tenantId,
      institutionId: cls.institutionId,
      institutionName: cls.institution.name,
      academicYearId: cls.academicYearId,
      academicYearName: cls.academicYear.name,
      name: cls.name,
      gradeLevel: cls.gradeLevel,
      homeroomTeacherId: cls.homeroomTeacherId,
      homeroomTeacherName: cls.homeroomTeacher?.fullName || null,
      studentCount: cls.classStudents.length,
      students: cls.classStudents.map((cs) => ({
        studentId: cs.studentId,
        nis: cs.student.nis,
        fullName: cs.student.fullName,
        gender: cs.student.gender,
        status: cs.student.status,
      })),
      createdAt: cls.createdAt,
    };
  }

  /**
   * Create class group
   */
  async createClass(
    tenantId: string,
    dto: CreateClassGroupDto,
    authorUserId?: string,
  ): Promise<ClassGroupResponseData> {
    const existing = await this.prisma.classGroup.findFirst({
      where: {
        tenantId,
        academicYearId: dto.academicYearId,
        institutionId: dto.institutionId,
        name: dto.name.trim(),
      },
    });

    if (existing) {
      throw new ConflictException(
        `Class '${dto.name}' already exists in this institution and academic year`,
      );
    }

    const created = await this.prisma.classGroup.create({
      data: {
        tenantId,
        institutionId: dto.institutionId,
        academicYearId: dto.academicYearId,
        name: dto.name.trim(),
        gradeLevel: dto.gradeLevel,
        homeroomTeacherId: dto.homeroomTeacherId,
      },
      include: {
        homeroomTeacher: true,
      },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'CLASS_CREATED',
      resource: 'ClassGroup',
      resourceId: created.id,
      newValues: { name: created.name, gradeLevel: created.gradeLevel },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      institutionId: created.institutionId,
      academicYearId: created.academicYearId,
      name: created.name,
      gradeLevel: created.gradeLevel,
      homeroomTeacherId: created.homeroomTeacherId,
      homeroomTeacherName: created.homeroomTeacher?.fullName || null,
      studentCount: 0,
      createdAt: created.createdAt,
    };
  }

  /**
   * Update class group
   */
  async updateClass(
    tenantId: string,
    id: string,
    dto: UpdateClassGroupDto,
    authorUserId?: string,
  ): Promise<ClassGroupResponseData> {
    const cls = await this.prisma.classGroup.findFirst({
      where: { id, tenantId },
    });

    if (!cls) {
      throw new NotFoundException(`Class with ID '${id}' not found`);
    }

    const updated = await this.prisma.classGroup.update({
      where: { id },
      data: {
        name: dto.name?.trim() || cls.name,
        gradeLevel: dto.gradeLevel !== undefined ? dto.gradeLevel : cls.gradeLevel,
        homeroomTeacherId:
          dto.homeroomTeacherId !== undefined ? dto.homeroomTeacherId : cls.homeroomTeacherId,
        institutionId: dto.institutionId || cls.institutionId,
        academicYearId: dto.academicYearId || cls.academicYearId,
      },
      include: {
        homeroomTeacher: true,
        _count: { select: { classStudents: true } },
      },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'CLASS_UPDATED',
      resource: 'ClassGroup',
      resourceId: id,
      newValues: dto as any,
    });

    return {
      id: updated.id,
      tenantId: updated.tenantId,
      institutionId: updated.institutionId,
      academicYearId: updated.academicYearId,
      name: updated.name,
      gradeLevel: updated.gradeLevel,
      homeroomTeacherId: updated.homeroomTeacherId,
      homeroomTeacherName: updated.homeroomTeacher?.fullName || null,
      studentCount: updated._count.classStudents,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Assign student to class
   */
  async assignStudent(
    tenantId: string,
    dto: AssignStudentToClassDto,
    authorUserId?: string,
  ) {
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId, deletedAt: null },
    });
    if (!student) {
      throw new NotFoundException(`Student '${dto.studentId}' not found in tenant`);
    }

    const cls = await this.prisma.classGroup.findFirst({
      where: { id: dto.classGroupId, tenantId },
    });
    if (!cls) {
      throw new NotFoundException(`Class '${dto.classGroupId}' not found in tenant`);
    }

    await this.prisma.classStudent.upsert({
      where: {
        classGroupId_studentId: {
          classGroupId: dto.classGroupId,
          studentId: dto.studentId,
        },
      },
      create: {
        classGroupId: dto.classGroupId,
        studentId: dto.studentId,
      },
      update: {},
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'STUDENT_ASSIGNED_TO_CLASS',
      resource: 'ClassStudent',
      newValues: { studentId: dto.studentId, classGroupId: dto.classGroupId },
    });

    return { message: 'Student successfully assigned to class' };
  }

  /**
   * Remove student from class
   */
  async removeStudent(
    tenantId: string,
    classGroupId: string,
    studentId: string,
    authorUserId?: string,
  ) {
    await this.prisma.classStudent.deleteMany({
      where: {
        classGroupId,
        studentId,
        classGroup: { tenantId },
      },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'STUDENT_REMOVED_FROM_CLASS',
      resource: 'ClassStudent',
      newValues: { studentId, classGroupId },
    });

    return { message: 'Student removed from class' };
  }
}
