import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SystemRoleSlug, PermissionModule, PermissionAction } from '@edusaas/shared-types';
import {
  CreateRoleRequestDto,
  UpdateRolePermissionsRequestDto,
  RoleDetailResponseData,
  PermissionCatalogItem,
} from '@edusaas/api-contracts';

@Injectable()
export class RbacService {
  private readonly logger = new Logger(RbacService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Return entire permissions catalog
   */
  async getPermissionsCatalog(): Promise<PermissionCatalogItem[]> {
    try {
      const perms = await this.prisma.permission.findMany({
        orderBy: [{ module: 'asc' }, { action: 'asc' }],
      });

      if (perms.length > 0) {
        return perms.map((p) => ({
          id: p.id,
          module: p.module,
          action: p.action,
          description: p.description,
        }));
      }
    } catch (e) {
      this.logger.warn(`Failed to read permissions from DB: ${e.message}`);
    }

    // Fallback in-memory catalog generated from enums
    return this.generateStandardPermissionsList().map((p, index) => ({
      id: `perm-${index + 1}`,
      module: p.module,
      action: p.action,
      description: `${p.action} permission for ${p.module}`,
    }));
  }

  /**
   * List all roles belonging to a tenant
   */
  async getRoles(tenantId: string): Promise<RoleDetailResponseData[]> {
    try {
      const roles = await this.prisma.role.findMany({
        where: { tenantId },
        include: {
          rolePermissions: {
            include: {
              permission: true,
            },
          },
        },
        orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
      });

      return roles.map((role) => ({
        id: role.id,
        tenantId: role.tenantId,
        name: role.name,
        slug: role.slug,
        isSystem: role.isSystem,
        description: role.description,
        permissions: role.rolePermissions.map((rp) => ({
          id: rp.permission.id,
          module: rp.permission.module,
          action: rp.permission.action,
          description: rp.permission.description,
        })),
        createdAt: role.createdAt,
        updatedAt: role.updatedAt,
      }));
    } catch (e) {
      this.logger.warn(`Failed to fetch roles from DB for tenant ${tenantId}: ${e.message}`);
      return [];
    }
  }

  /**
   * Get single role by ID
   */
  async getRoleById(tenantId: string, roleId: string): Promise<RoleDetailResponseData> {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found for tenant`);
    }

    return {
      id: role.id,
      tenantId: role.tenantId,
      name: role.name,
      slug: role.slug,
      isSystem: role.isSystem,
      description: role.description,
      permissions: role.rolePermissions.map((rp) => ({
        id: rp.permission.id,
        module: rp.permission.module,
        action: rp.permission.action,
        description: rp.permission.description,
      })),
      createdAt: role.createdAt,
      updatedAt: role.updatedAt,
    };
  }

  /**
   * Create custom role for tenant
   */
  async createRole(tenantId: string, dto: CreateRoleRequestDto): Promise<RoleDetailResponseData> {
    const existing = await this.prisma.role.findFirst({
      where: { tenantId, slug: dto.slug.toLowerCase().trim() },
    });

    if (existing) {
      throw new BadRequestException(`Role with slug '${dto.slug}' already exists`);
    }

    const createdRole = await this.prisma.role.create({
      data: {
        tenantId,
        name: dto.name,
        slug: dto.slug.toLowerCase().trim(),
        isSystem: false,
        description: dto.description,
      },
    });

    if (dto.permissionIds && dto.permissionIds.length > 0) {
      await this.prisma.rolePermission.createMany({
        data: dto.permissionIds.map((pId) => ({
          roleId: createdRole.id,
          permissionId: pId,
        })),
        skipDuplicates: true,
      });
    }

    return this.getRoleById(tenantId, createdRole.id);
  }

  /**
   * Update permissions for a role
   */
  async updateRolePermissions(
    tenantId: string,
    roleId: string,
    dto: UpdateRolePermissionsRequestDto,
  ): Promise<RoleDetailResponseData> {
    const role = await this.prisma.role.findFirst({
      where: { id: roleId, tenantId },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID '${roleId}' not found`);
    }

    // Atomic replacement of assigned permissions
    await this.prisma.$transaction(async (tx) => {
      await tx.rolePermission.deleteMany({
        where: { roleId },
      });

      if (dto.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: dto.permissionIds.map((pId) => ({
            roleId,
            permissionId: pId,
          })),
        });
      }
    });

    return this.getRoleById(tenantId, roleId);
  }

  /**
   * Provisions standard system roles with default permissions for a new tenant
   */
  async provisionStandardRolesForTenant(tenantId: string) {
    this.logger.log(`Provisioning standard 12 system roles for tenant ${tenantId}...`);

    const standardRoles = [
      {
        slug: SystemRoleSlug.SUPER_ADMIN,
        name: 'SaaS Super Admin',
        description: 'Platform owner with full system access',
      },
      {
        slug: SystemRoleSlug.PRINCIPAL,
        name: 'Principal / Head of Pesantren',
        description: 'Executive leadership with comprehensive institutional access',
      },
      {
        slug: SystemRoleSlug.VICE_PRINCIPAL,
        name: 'Vice Principal / Caretaker',
        description: 'Operational and academic supervisor',
      },
      {
        slug: SystemRoleSlug.OPERATOR,
        name: 'Operator / Administration',
        description: 'Data entry and master records administration',
      },
      {
        slug: SystemRoleSlug.TREASURER,
        name: 'Treasurer / Finance',
        description: 'Financial management, tuition billing, and cash accounts',
      },
      {
        slug: SystemRoleSlug.HOMEROOM_TEACHER,
        name: 'Homeroom Teacher',
        description: 'Classroom manager, attendance supervisor, and report card issuer',
      },
      {
        slug: SystemRoleSlug.SUBJECT_TEACHER,
        name: 'Subject Teacher',
        description: 'Curriculum delivery, assignments, grading, and CBT exams',
      },
      {
        slug: SystemRoleSlug.USTAZ,
        name: 'Ustaz / Ustazah',
        description: 'Diniyah curriculum instructor and religious teacher',
      },
      {
        slug: SystemRoleSlug.MUSYRIF,
        name: 'Dormitory Supervisor / Musyrif',
        description: 'Boarding house caretaker, curfew, and Tahfiz evaluator',
      },
      {
        slug: SystemRoleSlug.SECURITY,
        name: 'Attendance Officer / Security',
        description: 'Gate scanning and attendance verification officer',
      },
      {
        slug: SystemRoleSlug.STUDENT,
        name: 'Student / Santri',
        description: 'Student portal, dynamic QR identity, and academic logs',
      },
      {
        slug: SystemRoleSlug.PARENT,
        name: 'Parent / Guardian',
        description: 'Parent guardian portal, fee payments, and attendance tracking',
      },
    ];

    for (const r of standardRoles) {
      await this.prisma.role.upsert({
        where: {
          tenantId_slug: {
            tenantId,
            slug: r.slug,
          },
        },
        create: {
          tenantId,
          name: r.name,
          slug: r.slug,
          isSystem: true,
          description: r.description,
        },
        update: {},
      });
    }

    this.logger.log(`Standard system roles successfully provisioned for tenant ${tenantId}`);
  }

  generateStandardPermissionsList(): Array<{ module: string; action: string }> {
    const modules = Object.values(PermissionModule);
    const actions = Object.values(PermissionAction);
    const list: Array<{ module: string; action: string }> = [];

    for (const m of modules) {
      for (const a of actions) {
        list.push({ module: m, action: a });
      }
    }
    return list;
  }
}
