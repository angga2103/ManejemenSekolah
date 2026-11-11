import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import {
  CreateEmployeeDto,
  UpdateEmployeeDto,
  EmployeeResponseData,
} from '@edusaas/api-contracts';
import { SystemRoleSlug, Gender } from '@edusaas/shared-types';

@Injectable()
export class EmployeesService {
  private readonly logger = new Logger(EmployeesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  /**
   * List all employees in tenant
   */
  async listEmployees(tenantId: string, limit = 100): Promise<EmployeeResponseData[]> {
    const list = await this.prisma.employee.findMany({
      where: { tenantId },
      orderBy: [{ fullName: 'asc' }],
      take: limit,
      include: {
        user: true,
      },
    });

    return list.map((e) => ({
      id: e.id,
      tenantId: e.tenantId,
      userId: e.userId,
      nip: e.nip,
      fullName: e.fullName,
      gender: e.gender as unknown as Gender,
      position: e.position,
      employmentStatus: e.employmentStatus,
      email: e.user?.email || null,
      phone: e.user?.phone || null,
      createdAt: e.createdAt,
    }));
  }

  /**
   * Create an employee with linked User account and Role
   */
  async createEmployee(
    tenantId: string,
    dto: CreateEmployeeDto,
    authorUserId?: string,
  ): Promise<EmployeeResponseData> {
    if (dto.nip) {
      const existing = await this.prisma.employee.findFirst({
        where: { tenantId, nip: dto.nip.trim() },
      });
      if (existing) {
        throw new ConflictException(`Employee with NIP '${dto.nip}' already exists`);
      }
    }

    const defaultPasswordHash = await bcrypt.hash('Pegawai123!', 10);
    const targetRoleSlug = dto.roleSlug || SystemRoleSlug.SUBJECT_TEACHER;

    const role = await this.prisma.role.findFirst({
      where: { tenantId, slug: targetRoleSlug },
    });

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create User
      const user = await tx.user.create({
        data: {
          tenantId,
          email: dto.email.toLowerCase().trim(),
          phone: dto.phone?.trim() || null,
          passwordHash: defaultPasswordHash,
          fullName: dto.fullName.trim(),
          isActive: true,
        },
      });

      // 2. Assign Role
      if (role) {
        await tx.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
            isPrimary: true,
          },
        });
      }

      // 3. Create Employee
      const employee = await tx.employee.create({
        data: {
          tenantId,
          userId: user.id,
          nip: dto.nip?.trim() || null,
          fullName: dto.fullName.trim(),
          gender: dto.gender as any,
          position: dto.position.trim(),
          employmentStatus: dto.employmentStatus || 'PERMANENT',
        },
      });

      return { employee, user };
    });

    await this.auditService.record({
      tenantId,
      userId: authorUserId,
      action: 'EMPLOYEE_CREATED',
      resource: 'Employee',
      resourceId: result.employee.id,
      newValues: { fullName: result.employee.fullName, position: result.employee.position },
    });

    return {
      id: result.employee.id,
      tenantId: result.employee.tenantId,
      userId: result.user.id,
      nip: result.employee.nip,
      fullName: result.employee.fullName,
      gender: result.employee.gender as unknown as Gender,
      position: result.employee.position,
      employmentStatus: result.employee.employmentStatus,
      email: result.user.email,
      phone: result.user.phone,
      createdAt: result.employee.createdAt,
    };
  }
}
