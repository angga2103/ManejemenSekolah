import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateInstitutionDto,
  UpdateInstitutionDto,
  InstitutionResponseData,
  CreateAcademicYearDto,
  AcademicYearResponseData,
} from '@edusaas/api-contracts';

@Injectable()
export class InstitutionsService {
  private readonly logger = new Logger(InstitutionsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * List institutions (e.g. Formal School unit, Pesantren boarding unit)
   */
  async listInstitutions(tenantId: string): Promise<InstitutionResponseData[]> {
    const list = await this.prisma.institution.findMany({
      where: { tenantId },
      orderBy: [{ name: 'asc' }],
    });

    return list.map((i) => ({
      id: i.id,
      tenantId: i.tenantId,
      name: i.name,
      code: i.code,
      npsn: i.npsn,
      type: i.type,
      createdAt: i.createdAt,
      updatedAt: i.updatedAt,
    }));
  }

  /**
   * Create an institution unit under active tenant
   */
  async createInstitution(
    tenantId: string,
    dto: CreateInstitutionDto,
    authorUserId?: string,
  ): Promise<InstitutionResponseData> {
    const existing = await this.prisma.institution.findFirst({
      where: { tenantId, code: dto.code.trim().toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Institution with code '${dto.code}' already exists`);
    }

    const created = await this.prisma.institution.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        npsn: dto.npsn?.trim(),
        type: dto.type.trim(),
      },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'INSTITUTION_CREATED',
      resource: 'Institution',
      resourceId: created.id,
      newValues: { name: created.name, code: created.code },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      name: created.name,
      code: created.code,
      npsn: created.npsn,
      type: created.type,
      createdAt: created.createdAt,
      updatedAt: created.updatedAt,
    };
  }

  /**
   * List academic years
   */
  async listAcademicYears(tenantId: string): Promise<AcademicYearResponseData[]> {
    const list = await this.prisma.academicYear.findMany({
      where: { tenantId },
      orderBy: [{ startDate: 'desc' }],
    });

    return list.map((ay) => ({
      id: ay.id,
      tenantId: ay.tenantId,
      name: ay.name,
      semester: ay.semester,
      startDate: ay.startDate,
      endDate: ay.endDate,
      isActive: ay.isActive,
      createdAt: ay.createdAt,
    }));
  }

  /**
   * Create academic year
   */
  async createAcademicYear(
    tenantId: string,
    dto: CreateAcademicYearDto,
    authorUserId?: string,
  ): Promise<AcademicYearResponseData> {
    const isActive = dto.isActive ?? false;

    if (isActive) {
      await this.prisma.academicYear.updateMany({
        where: { tenantId },
        data: { isActive: false },
      });
    }

    const created = await this.prisma.academicYear.create({
      data: {
        tenantId,
        name: dto.name.trim(),
        semester: dto.semester.trim(),
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        isActive,
      },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'ACADEMIC_YEAR_CREATED',
      resource: 'AcademicYear',
      resourceId: created.id,
      newValues: { name: created.name, semester: created.semester, isActive },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      name: created.name,
      semester: created.semester,
      startDate: created.startDate,
      endDate: created.endDate,
      isActive: created.isActive,
      createdAt: created.createdAt,
    };
  }

  /**
   * Set an academic year as currently active
   */
  async setActiveAcademicYear(tenantId: string, id: string, authorUserId?: string) {
    const target = await this.prisma.academicYear.findFirst({
      where: { id, tenantId },
    });

    if (!target) {
      throw new NotFoundException(`Academic year '${id}' not found`);
    }

    await this.prisma.$transaction([
      this.prisma.academicYear.updateMany({
        where: { tenantId },
        data: { isActive: false },
      }),
      this.prisma.academicYear.update({
        where: { id },
        data: { isActive: true },
      }),
    ]);

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'ACADEMIC_YEAR_ACTIVATED',
      resource: 'AcademicYear',
      resourceId: id,
    });

    return { message: `Academic year '${target.name}' is now active` };
  }
}
