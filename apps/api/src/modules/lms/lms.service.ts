import { Injectable, Logger, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { AssignmentStatus, MaterialType } from '@edusaas/shared-types';
import {
  CreateCourseMaterialDto,
  CourseMaterialFilterDto,
  CourseMaterialResponseData,
  CreateAssignmentDto,
  AssignmentFilterDto,
  AssignmentResponseData,
  SubmitAssignmentDto,
  GradeAssignmentDto,
  AssignmentSubmissionResponseData,
} from '@edusaas/api-contracts';
import { Prisma } from '@prisma/client';

@Injectable()
export class LmsService {
  private readonly logger = new Logger(LmsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
  ) {}

  // ===========================================================================
  // 1. COURSE MATERIALS (MATERI BELAJAR DIGITAL)
  // ===========================================================================

  async createMaterial(
    tenantId: string,
    userId: string,
    dto: CreateCourseMaterialDto,
  ): Promise<CourseMaterialResponseData> {
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, tenantId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${dto.subjectId} not found`);
    }

    if (dto.classGroupId) {
      const classGroup = await this.prisma.classGroup.findFirst({
        where: { id: dto.classGroupId, tenantId },
      });
      if (!classGroup) {
        throw new NotFoundException(`ClassGroup with ID ${dto.classGroupId} not found`);
      }
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId, tenantId },
    });

    const material = await this.prisma.courseMaterial.create({
      data: {
        tenantId,
        subjectId: dto.subjectId,
        classGroupId: dto.classGroupId || null,
        authorEmployeeId: employee?.id || null,
        title: dto.title,
        description: dto.description || null,
        materialType: (dto.materialType as MaterialType) || MaterialType.DOCUMENT,
        fileUrl: dto.fileUrl || null,
        content: dto.content || null,
        isPublished: dto.isPublished !== undefined ? dto.isPublished : true,
      },
      include: {
        subject: true,
        classGroup: true,
        author: true,
      },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'COURSE_MATERIAL_CREATED',
      resource: 'course_materials',
      resourceId: material.id,
      newValues: { title: dto.title, subjectId: dto.subjectId },
    });

    return this.mapMaterialToResponse(material);
  }

  async findMaterials(
    tenantId: string,
    filter: CourseMaterialFilterDto,
    studentUserId?: string,
  ): Promise<{ data: CourseMaterialResponseData[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    let allowedClassGroupIds: (string | null)[] | undefined = undefined;

    if (studentUserId) {
      const student = await this.prisma.student.findFirst({
        where: { userId: studentUserId, tenantId },
        include: { classStudents: true },
      });
      if (!student) {
        return { data: [], total: 0, page, limit };
      }
      // Student can see school-wide materials (classGroupId: null) and materials for their classes
      allowedClassGroupIds = [null, ...student.classStudents.map((cs) => cs.classGroupId)];
    }

    const where: Prisma.CourseMaterialWhereInput = {
      tenantId,
      ...(filter.subjectId && { subjectId: filter.subjectId }),
      ...(filter.classGroupId && { classGroupId: filter.classGroupId }),
      ...(filter.materialType && { materialType: filter.materialType as MaterialType }),
      ...(filter.search && {
        OR: [
          { title: { contains: filter.search, mode: 'insensitive' } },
          { description: { contains: filter.search, mode: 'insensitive' } },
        ],
      }),
      ...(studentUserId && {
        isPublished: true,
        OR: [
          { classGroupId: null },
          { classGroupId: { in: allowedClassGroupIds?.filter((id): id is string => id !== null) } },
        ],
      }),
    };

    const [materials, total] = await Promise.all([
      this.prisma.courseMaterial.findMany({
        where,
        include: {
          subject: true,
          classGroup: true,
          author: true,
        },
        orderBy: [{ createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      this.prisma.courseMaterial.count({ where }),
    ]);

    return {
      data: materials.map((m) => this.mapMaterialToResponse(m)),
      total,
      page,
      limit,
    };
  }

  async findMaterialById(tenantId: string, id: string): Promise<CourseMaterialResponseData> {
    const material = await this.prisma.courseMaterial.findFirst({
      where: { id, tenantId },
      include: {
        subject: true,
        classGroup: true,
        author: true,
      },
    });

    if (!material) {
      throw new NotFoundException(`Course material with ID ${id} not found`);
    }

    return this.mapMaterialToResponse(material);
  }

  // ===========================================================================
  // 2. ASSIGNMENTS & SUBMISSIONS (TUGAS SANTRI)
  // ===========================================================================

  async createAssignment(
    tenantId: string,
    userId: string,
    dto: CreateAssignmentDto,
  ): Promise<AssignmentResponseData> {
    const subject = await this.prisma.subject.findFirst({
      where: { id: dto.subjectId, tenantId },
    });
    if (!subject) {
      throw new NotFoundException(`Subject with ID ${dto.subjectId} not found`);
    }

    const classGroup = await this.prisma.classGroup.findFirst({
      where: { id: dto.classGroupId, tenantId },
    });
    if (!classGroup) {
      throw new NotFoundException(`ClassGroup with ID ${dto.classGroupId} not found`);
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId, tenantId },
    });

    const maxScore = dto.maxScore !== undefined && dto.maxScore > 0 ? dto.maxScore : 100.0;

    const assignment = await this.prisma.assignment.create({
      data: {
        tenantId,
        subjectId: dto.subjectId,
        classGroupId: dto.classGroupId,
        teacherEmployeeId: employee?.id || null,
        title: dto.title,
        instructions: dto.instructions,
        attachmentUrl: dto.attachmentUrl || null,
        dueDate: new Date(dto.dueDate),
        maxScore: new Prisma.Decimal(maxScore),
        isPublished: dto.isPublished !== undefined ? dto.isPublished : true,
      },
      include: {
        subject: true,
        classGroup: true,
        teacher: true,
      },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'ASSIGNMENT_CREATED',
      resource: 'assignments',
      resourceId: assignment.id,
      newValues: { title: dto.title, classGroupId: dto.classGroupId },
    });

    return this.mapAssignmentToResponse(assignment, 0, 0);
  }

  async findAssignments(
    tenantId: string,
    filter: AssignmentFilterDto,
    studentUserId?: string,
  ): Promise<{ data: AssignmentResponseData[]; total: number; page: number; limit: number }> {
    const page = Math.max(1, Number(filter.page) || 1);
    const limit = Math.min(100, Math.max(1, Number(filter.limit) || 20));
    const skip = (page - 1) * limit;

    let allowedClassGroupIds: string[] | undefined = undefined;

    if (studentUserId) {
      const student = await this.prisma.student.findFirst({
        where: { userId: studentUserId, tenantId },
        include: { classStudents: true },
      });
      if (!student) {
        return { data: [], total: 0, page, limit };
      }
      allowedClassGroupIds = student.classStudents.map((cs) => cs.classGroupId);
    }

    const where: Prisma.AssignmentWhereInput = {
      tenantId,
      ...(filter.subjectId && { subjectId: filter.subjectId }),
      ...(filter.classGroupId && { classGroupId: filter.classGroupId }),
      ...(allowedClassGroupIds && { classGroupId: { in: allowedClassGroupIds }, isPublished: true }),
    };

    const [assignments, total] = await Promise.all([
      this.prisma.assignment.findMany({
        where,
        include: {
          subject: true,
          classGroup: true,
          teacher: true,
          submissions: true,
        },
        orderBy: [{ dueDate: 'asc' }],
        skip,
        take: limit,
      }),
      this.prisma.assignment.count({ where }),
    ]);

    const data = assignments.map((a) => {
      const totalSubs = a.submissions.length;
      const gradedSubs = a.submissions.filter((s) => s.status === AssignmentStatus.GRADED).length;
      return this.mapAssignmentToResponse(a, totalSubs, gradedSubs);
    });

    return { data, total, page, limit };
  }

  async submitAssignment(
    tenantId: string,
    studentUserId: string,
    assignmentId: string,
    dto: SubmitAssignmentDto,
  ): Promise<AssignmentSubmissionResponseData> {
    const student = await this.prisma.student.findFirst({
      where: { userId: studentUserId, tenantId },
    });
    if (!student) {
      throw new NotFoundException('Student profile not found for current user');
    }

    const assignment = await this.prisma.assignment.findFirst({
      where: { id: assignmentId, tenantId },
    });
    if (!assignment) {
      throw new NotFoundException(`Assignment with ID ${assignmentId} not found`);
    }

    const now = new Date();
    const isLate = now > assignment.dueDate;
    const initialStatus = isLate ? AssignmentStatus.LATE : AssignmentStatus.SUBMITTED;

    const submission = await this.prisma.assignmentSubmission.upsert({
      where: {
        tenantId_assignmentId_studentId: {
          tenantId,
          assignmentId,
          studentId: student.id,
        },
      },
      update: {
        fileUrl: dto.fileUrl || null,
        content: dto.content || null,
        submittedAt: now,
        status: initialStatus,
      },
      create: {
        tenantId,
        assignmentId,
        studentId: student.id,
        fileUrl: dto.fileUrl || null,
        content: dto.content || null,
        submittedAt: now,
        status: initialStatus,
      },
      include: {
        assignment: true,
        student: true,
        gradedBy: true,
      },
    });

    await this.auditService.record({
      tenantId,
      userId: studentUserId,
      action: 'ASSIGNMENT_SUBMITTED',
      resource: 'assignment_submissions',
      resourceId: submission.id,
      newValues: { assignmentId, isLate },
    });

    return this.mapSubmissionToResponse(submission);
  }

  async gradeSubmission(
    tenantId: string,
    userId: string,
    submissionId: string,
    dto: GradeAssignmentDto,
  ): Promise<AssignmentSubmissionResponseData> {
    if (dto.score < 0 || dto.score > 100) {
      throw new BadRequestException('Score must be between 0 and 100');
    }

    const submission = await this.prisma.assignmentSubmission.findFirst({
      where: { id: submissionId, tenantId },
    });
    if (!submission) {
      throw new NotFoundException(`Submission with ID ${submissionId} not found`);
    }

    const employee = await this.prisma.employee.findFirst({
      where: { userId, tenantId },
    });

    const updated = await this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        score: new Prisma.Decimal(dto.score),
        feedback: dto.feedback || null,
        gradedByEmployeeId: employee?.id || null,
        gradedAt: new Date(),
        status: AssignmentStatus.GRADED,
      },
      include: {
        assignment: true,
        student: true,
        gradedBy: true,
      },
    });

    await this.auditService.record({
      tenantId,
      userId,
      action: 'ASSIGNMENT_GRADED',
      resource: 'assignment_submissions',
      resourceId: submission.id,
      newValues: { score: dto.score },
    });

    return this.mapSubmissionToResponse(updated);
  }

  private mapMaterialToResponse(m: any): CourseMaterialResponseData {
    return {
      id: m.id,
      tenantId: m.tenantId,
      subjectId: m.subjectId,
      subjectName: m.subject?.name,
      subjectCode: m.subject?.code,
      curriculumType: m.subject?.curriculumType,
      classGroupId: m.classGroupId,
      classGroupName: m.classGroup?.name,
      authorEmployeeId: m.authorEmployeeId,
      authorName: m.author?.fullName,
      title: m.title,
      description: m.description,
      materialType: m.materialType,
      fileUrl: m.fileUrl,
      content: m.content,
      isPublished: m.isPublished,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    };
  }

  private mapAssignmentToResponse(a: any, totalSubmissions = 0, gradedSubmissions = 0): AssignmentResponseData {
    return {
      id: a.id,
      tenantId: a.tenantId,
      subjectId: a.subjectId,
      subjectName: a.subject?.name,
      subjectCode: a.subject?.code,
      classGroupId: a.classGroupId,
      classGroupName: a.classGroup?.name,
      teacherEmployeeId: a.teacherEmployeeId,
      teacherName: a.teacher?.fullName,
      title: a.title,
      instructions: a.instructions,
      attachmentUrl: a.attachmentUrl,
      dueDate: a.dueDate.toISOString(),
      maxScore: Number(a.maxScore),
      isPublished: a.isPublished,
      totalSubmissions,
      gradedSubmissions,
      createdAt: a.createdAt.toISOString(),
      updatedAt: a.updatedAt.toISOString(),
    };
  }

  private mapSubmissionToResponse(s: any): AssignmentSubmissionResponseData {
    return {
      id: s.id,
      tenantId: s.tenantId,
      assignmentId: s.assignmentId,
      assignmentTitle: s.assignment?.title,
      studentId: s.studentId,
      studentName: s.student?.fullName,
      studentNis: s.student?.nis,
      submittedAt: s.submittedAt.toISOString(),
      fileUrl: s.fileUrl,
      content: s.content,
      score: s.score ? Number(s.score) : null,
      feedback: s.feedback,
      gradedByEmployeeId: s.gradedByEmployeeId,
      gradedByName: s.gradedBy?.fullName,
      gradedAt: s.gradedAt ? s.gradedAt.toISOString() : null,
      status: s.status,
      createdAt: s.submittedAt.toISOString(),
    };
  }
}
