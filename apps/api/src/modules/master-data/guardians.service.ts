import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import {
  CreateGuardianDto,
  UpdateGuardianDto,
  GuardianResponseData,
  LinkStudentGuardianDto,
  UpdateStudentGuardianDto,
  StudentGuardianLinkResponseData,
} from '@edusaas/api-contracts';
import { SystemRoleSlug, GuardianRelationshipType } from '@edusaas/shared-types';

@Injectable()
export class GuardiansService {
  private readonly logger = new Logger(GuardiansService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  public maskSensitiveNik(nik?: string | null): string | null {
    if (!nik) return null;
    const trimmed = nik.trim();
    if (trimmed.length <= 4) return '****';
    return trimmed.slice(0, 4) + '*'.repeat(Math.max(4, trimmed.length - 4));
  }

  public canViewFullNik(currentUser?: any): boolean {
    if (!currentUser) return false;
    const roles: any[] = Array.isArray(currentUser.roles) ? currentUser.roles : [];
    const isSuperAdmin = roles.some((r: any) => (typeof r === 'string' ? r : r.slug) === 'super_admin');
    const permissions: string[] = currentUser.permissions || [];
    const hasManagePermission =
      permissions.includes('guardians:manage') ||
      permissions.includes('students:manage') ||
      permissions.includes('guardians:full_pii');
    return isSuperAdmin || hasManagePermission;
  }


  /**
   * List guardians in tenant
   */
  async listGuardians(
    tenantId: string,
    search?: string,
    limit = 50,
    currentUser?: any,
  ): Promise<GuardianResponseData[]> {
    const where: any = { tenantId };

    if (search && search.trim()) {
      const s = search.trim();
      where.OR = [
        { fullName: { contains: s, mode: 'insensitive' } },
        { phone: { contains: s, mode: 'insensitive' } },
        { nik: { contains: s, mode: 'insensitive' } },
      ];
    }

    const guardians = await this.prisma.guardian.findMany({
      where,
      take: limit,
      orderBy: [{ fullName: 'asc' }],
      include: {
        _count: {
          select: { students: true },
        },
      },
    });

    const allowFullNik = this.canViewFullNik(currentUser);
    return guardians.map((g) => ({
      id: g.id,
      tenantId: g.tenantId,
      userId: g.userId,
      fullName: g.fullName,
      phone: g.phone,
      email: null,
      nik: allowFullNik ? g.nik : this.maskSensitiveNik(g.nik),
      occupation: g.occupation,
      address: g.address,
      linkedStudentsCount: g._count.students,
      createdAt: g.createdAt,
    }));
  }

  /**
   * Get guardian by ID
   */
  async getGuardianById(tenantId: string, id: string, currentUser?: any): Promise<any> {
    const guardian = await this.prisma.guardian.findFirst({
      where: { id, tenantId },
      include: {
        user: true,
        students: {
          include: {
            student: true,
          },
        },
      },
    });

    if (!guardian) {
      throw new NotFoundException(`Guardian with ID '${id}' not found`);
    }

    const allowFullNik = this.canViewFullNik(currentUser);
    return {
      id: guardian.id,
      tenantId: guardian.tenantId,
      userId: guardian.userId,
      fullName: guardian.fullName,
      phone: guardian.phone,
      email: guardian.user?.email || null,
      nik: allowFullNik ? guardian.nik : this.maskSensitiveNik(guardian.nik),
      occupation: guardian.occupation,
      address: guardian.address,
      linkedStudents: guardian.students.map((sg) => ({
        linkId: sg.id,
        studentId: sg.studentId,
        studentNis: sg.student.nis,
        studentName: sg.student.fullName,
        relationshipType: sg.relationshipType,
        isPrimary: sg.isPrimary,
        hasFinancialAccess: sg.hasFinancialAccess,
        isEmergencyContact: sg.isEmergencyContact,
        receivePush: sg.receivePush,
        receiveWhatsapp: sg.receiveWhatsapp,
      })),
      createdAt: guardian.createdAt,
    };
  }

  /**
   * Create a new guardian with auto-provisioned user account & Parent role
   */
  async createGuardian(
    tenantId: string,
    dto: CreateGuardianDto,
    authorUserId?: string,
  ): Promise<GuardianResponseData> {
    const parentRole = await this.prisma.role.findFirst({
      where: { tenantId, slug: SystemRoleSlug.PARENT },
    });

    const defaultPasswordHash = await bcrypt.hash('WaliSantri123!', 10);

    const guardian = await this.prisma.$transaction(async (tx) => {
      // 1. Create User account for guardian
      const user = await tx.user.create({
        data: {
          tenantId,
          email: dto.email?.toLowerCase().trim() || null,
          phone: dto.phone.trim(),
          passwordHash: defaultPasswordHash,
          fullName: dto.fullName.trim(),
          isActive: true,
        },
      });

      // 2. Assign Parent role
      if (parentRole) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: parentRole.id,
            isPrimary: true,
          },
        });
      }

      // 3. Create Guardian record
      return tx.guardian.create({
        data: {
          tenantId,
          userId: user.id,
          fullName: dto.fullName.trim(),
          phone: dto.phone.trim(),
          nik: dto.nik?.trim() || null,
          occupation: dto.occupation?.trim() || null,
          address: dto.address?.trim() || null,
        },
      });
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'GUARDIAN_CREATED',
      resource: 'Guardian',
      resourceId: guardian.id,
      newValues: { fullName: guardian.fullName, phone: guardian.phone },
    });

    return {
      id: guardian.id,
      tenantId: guardian.tenantId,
      userId: guardian.userId,
      fullName: guardian.fullName,
      phone: guardian.phone,
      email: dto.email || null,
      nik: this.maskSensitiveNik(guardian.nik),
      occupation: guardian.occupation,
      address: guardian.address,
      linkedStudentsCount: 0,
      createdAt: guardian.createdAt,
    };
  }

  /**
   * Link Student with Guardian (Support 1:N and N:M with granular permissions)
   */
  async linkStudentGuardian(
    tenantId: string,
    dto: LinkStudentGuardianDto,
    authorUserId?: string,
  ): Promise<StudentGuardianLinkResponseData> {
    // 1. Validate student exists in tenant
    const student = await this.prisma.student.findFirst({
      where: { id: dto.studentId, tenantId, deletedAt: null },
    });
    if (!student) {
      throw new NotFoundException(`Student '${dto.studentId}' not found in tenant`);
    }

    // 2. Validate guardian exists in tenant
    const guardian = await this.prisma.guardian.findFirst({
      where: { id: dto.guardianId, tenantId },
    });
    if (!guardian) {
      throw new NotFoundException(`Guardian '${dto.guardianId}' not found in tenant`);
    }

    // 3. Check for duplicate link
    const existing = await this.prisma.studentGuardian.findUnique({
      where: {
        studentId_guardianId: {
          studentId: dto.studentId,
          guardianId: dto.guardianId,
        },
      },
    });

    if (existing) {
      throw new ConflictException('This student is already linked to this guardian');
    }

    // If marked isPrimary, clear other primary flags for this student
    if (dto.isPrimary) {
      await this.prisma.studentGuardian.updateMany({
        where: { studentId: dto.studentId },
        data: { isPrimary: false },
      });
    }

    const link = await this.prisma.studentGuardian.create({
      data: {
        tenantId,
        studentId: dto.studentId,
        guardianId: dto.guardianId,
        relationshipType: dto.relationshipType as any,
        isPrimary: dto.isPrimary ?? false,
        hasFinancialAccess: dto.hasFinancialAccess ?? true,
        isEmergencyContact: dto.isEmergencyContact ?? true,
        receivePush: dto.receivePush ?? true,
        receiveWhatsapp: dto.receiveWhatsapp ?? true,
      },
      include: {
        student: true,
        guardian: true,
      },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'STUDENT_GUARDIAN_LINKED',
      resource: 'StudentGuardian',
      resourceId: link.id,
      newValues: {
        studentId: dto.studentId,
        guardianId: dto.guardianId,
        relationship: dto.relationshipType,
      },
    });

    return {
      id: link.id,
      studentId: link.studentId,
      studentName: link.student.fullName,
      studentNis: link.student.nis,
      guardianId: link.guardianId,
      guardianName: link.guardian.fullName,
      guardianPhone: link.guardian.phone,
      relationshipType: link.relationshipType as unknown as GuardianRelationshipType,
      isPrimary: link.isPrimary,
      hasFinancialAccess: link.hasFinancialAccess,
      isEmergencyContact: link.isEmergencyContact,
      receivePush: link.receivePush,
      receiveWhatsapp: link.receiveWhatsapp,
      createdAt: link.createdAt,
    };
  }

  /**
   * Update student-guardian relationship preferences
   */
  async updateStudentGuardianLink(
    tenantId: string,
    linkId: string,
    dto: UpdateStudentGuardianDto,
    authorUserId?: string,
  ): Promise<StudentGuardianLinkResponseData> {
    const link = await this.prisma.studentGuardian.findFirst({
      where: { id: linkId, tenantId },
      include: { student: true, guardian: true },
    });

    if (!link) {
      throw new NotFoundException(`Student-guardian relationship not found`);
    }

    if (dto.isPrimary) {
      await this.prisma.studentGuardian.updateMany({
        where: { studentId: link.studentId, id: { not: linkId } },
        data: { isPrimary: false },
      });
    }

    const updated = await this.prisma.studentGuardian.update({
      where: { id: linkId },
      data: {
        relationshipType: dto.relationshipType ? (dto.relationshipType as any) : link.relationshipType,
        isPrimary: dto.isPrimary !== undefined ? dto.isPrimary : link.isPrimary,
        hasFinancialAccess:
          dto.hasFinancialAccess !== undefined ? dto.hasFinancialAccess : link.hasFinancialAccess,
        isEmergencyContact:
          dto.isEmergencyContact !== undefined ? dto.isEmergencyContact : link.isEmergencyContact,
        receivePush: dto.receivePush !== undefined ? dto.receivePush : link.receivePush,
        receiveWhatsapp:
          dto.receiveWhatsapp !== undefined ? dto.receiveWhatsapp : link.receiveWhatsapp,
      },
      include: { student: true, guardian: true },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'STUDENT_GUARDIAN_UPDATED',
      resource: 'StudentGuardian',
      resourceId: linkId,
      newValues: dto as any,
    });

    return {
      id: updated.id,
      studentId: updated.studentId,
      studentName: updated.student.fullName,
      studentNis: updated.student.nis,
      guardianId: updated.guardianId,
      guardianName: updated.guardian.fullName,
      guardianPhone: updated.guardian.phone,
      relationshipType: updated.relationshipType as unknown as GuardianRelationshipType,
      isPrimary: updated.isPrimary,
      hasFinancialAccess: updated.hasFinancialAccess,
      isEmergencyContact: updated.isEmergencyContact,
      receivePush: updated.receivePush,
      receiveWhatsapp: updated.receiveWhatsapp,
      createdAt: updated.createdAt,
    };
  }

  /**
   * Unlink student and guardian
   */
  async unlinkStudentGuardian(tenantId: string, linkId: string, authorUserId?: string) {
    const link = await this.prisma.studentGuardian.findFirst({
      where: { id: linkId, tenantId },
    });

    if (!link) {
      throw new NotFoundException(`Student-guardian link with ID '${linkId}' not found`);
    }

    await this.prisma.studentGuardian.delete({
      where: { id: linkId },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'STUDENT_GUARDIAN_UNLINKED',
      resource: 'StudentGuardian',
      resourceId: linkId,
    });

    return { message: 'Student and guardian unlinked successfully' };
  }
}
