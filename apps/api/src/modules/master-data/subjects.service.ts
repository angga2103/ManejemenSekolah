import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  CreateSubjectDto,
  UpdateSubjectDto,
  SubjectResponseData,
} from '@edusaas/api-contracts';

@Injectable()
export class SubjectsService {
  private readonly logger = new Logger(SubjectsService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * List subjects for tenant
   */
  async listSubjects(
    tenantId: string,
    institutionId?: string,
  ): Promise<SubjectResponseData[]> {
    const where: any = { tenantId };
    if (institutionId) {
      where.institutionId = institutionId;
    }

    const list = await this.prisma.subject.findMany({
      where,
      orderBy: [{ name: 'asc' }],
    });

    return list.map((s) => ({
      id: s.id,
      tenantId: s.tenantId,
      institutionId: s.institutionId,
      name: s.name,
      code: s.code,
      curriculumType: s.curriculumType,
    }));
  }

  /**
   * Create subject
   */
  async createSubject(
    tenantId: string,
    dto: CreateSubjectDto,
    authorUserId?: string,
  ): Promise<SubjectResponseData> {
    const existing = await this.prisma.subject.findFirst({
      where: { tenantId, code: dto.code.trim().toUpperCase() },
    });

    if (existing) {
      throw new ConflictException(`Subject with code '${dto.code}' already exists`);
    }

    const created = await this.prisma.subject.create({
      data: {
        tenantId,
        institutionId: dto.institutionId,
        name: dto.name.trim(),
        code: dto.code.trim().toUpperCase(),
        curriculumType: dto.curriculumType || 'FORMAL_NATIONAL',
      },
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'SUBJECT_CREATED',
      resource: 'Subject',
      resourceId: created.id,
      newValues: { name: created.name, code: created.code },
    });

    return {
      id: created.id,
      tenantId: created.tenantId,
      institutionId: created.institutionId,
      name: created.name,
      code: created.code,
      curriculumType: created.curriculumType,
    };
  }
}
