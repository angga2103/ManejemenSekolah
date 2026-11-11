import {
  Injectable,
  ConflictException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';
import { AuditService } from '../audit/audit.service';
import {
  RegisterTenantRequestDto,
  RegisterTenantResponseData,
  TenantPublicInfoResponseData,
  TenantDetailResponseData,
  UpdateTenantSettingsRequestDto,
} from '@edusaas/api-contracts';
import {
  TenantStatus,
  SubscriptionTier,
  SystemRoleSlug,
} from '@edusaas/shared-types';

@Injectable()
export class TenantsService {
  private readonly logger = new Logger(TenantsService.name);

  constructor(
    private prisma: PrismaService,
    private rbacService: RbacService,
    private auditService: AuditService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  /**
   * Register and provision a new School or Pesantren tenant with initial Administrator
   */
  async registerTenant(
    dto: RegisterTenantRequestDto,
  ): Promise<RegisterTenantResponseData> {
    const slug = dto.slug.toLowerCase().trim();
    const subdomain = dto.subdomain.toLowerCase().trim();

    // Check slug or subdomain conflict
    const existing = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ slug }, { subdomain }],
      },
    });

    if (existing) {
      if (existing.slug === slug) {
        throw new ConflictException(`Tenant slug '${slug}' is already registered`);
      }
      throw new ConflictException(`Subdomain '${subdomain}' is already taken`);
    }

    const hashedPassword = await bcrypt.hash(dto.adminPassword, 10);
    const tier = dto.tier || SubscriptionTier.BASIC;

    // Transactional provisioning of Tenant, Settings, Subscription, Roles, and Admin User
    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Create Tenant
      const tenant = await tx.tenant.create({
        data: {
          name: dto.name,
          slug,
          subdomain,
          customDomain: dto.customDomain,
          status: TenantStatus.TRIAL,
        },
      });

      // 2. Create Tenant Settings
      await tx.tenantSettings.create({
        data: {
          tenantId: tenant.id,
          primaryColor: '#1E40AF',
          timezone: 'Asia/Jakarta',
          dateFormat: 'DD/MM/YYYY',
          currency: 'IDR',
          isFormalEnabled: dto.isFormalEnabled ?? true,
          isPesantrenEnabled: dto.isPesantrenEnabled ?? true,
        },
      });

      // 3. Create Default Subscription (1 Year Trial)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await tx.tenantSubscription.create({
        data: {
          tenantId: tenant.id,
          tier,
          maxStudents: tier === SubscriptionTier.ENTERPRISE ? 3000 : 1000,
          enabledModules: [
            'MASTER_DATA',
            'USERS',
            'ATTENDANCE',
            'FINANCE',
            'ACADEMICS',
            'PESANTREN',
            'TAHFIZ',
            'DORMITORY',
          ],
          startDate,
          endDate,
          isActive: true,
        },
      });

      // 4. Create Initial Administrator User
      const adminUser = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: dto.adminEmail.toLowerCase().trim(),
          phone: dto.adminPhone?.trim() || null,
          passwordHash: hashedPassword,
          fullName: dto.adminFullName,
          isActive: true,
        },
      });

      return { tenant, adminUser };
    });

    // 5. Provision standard 12 roles for this tenant
    await this.rbacService.provisionStandardRolesForTenant(result.tenant.id);

    // 6. Assign Principal / SaaS Administrator role to the user
    const principalRole = await this.prisma.role.findFirst({
      where: {
        tenantId: result.tenant.id,
        slug: SystemRoleSlug.PRINCIPAL,
      },
    });

    if (principalRole) {
      await this.prisma.userRole.create({
        data: {
          userId: result.adminUser.id,
          roleId: principalRole.id,
        },
      });
    }

    // 7. Audit Log
    await this.auditService.record({
      tenantId: result.tenant.id,
      userId: result.adminUser.id,
      action: 'TENANT_REGISTERED',
      resource: 'tenants',
      resourceId: result.tenant.id,
      newValues: { name: result.tenant.name, slug, tier },
    });

    // 8. Generate initial Auth Tokens
    const payload = {
      sub: result.adminUser.id,
      tenantId: result.tenant.id,
      email: result.adminUser.email,
      roles: [SystemRoleSlug.PRINCIPAL],
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, {
      secret:
        this.configService.get<string>('JWT_REFRESH_SECRET') ||
        'dev_refresh_secret_do_not_use_in_production_min_length_32_chars_67890',
      expiresIn: '7d',
    });

    return {
      tenant: {
        id: result.tenant.id,
        name: result.tenant.name,
        slug: result.tenant.slug,
        subdomain: result.tenant.subdomain,
        status: result.tenant.status as unknown as TenantStatus,
        createdAt: result.tenant.createdAt,
      },
      adminUser: {
        id: result.adminUser.id,
        email: result.adminUser.email || '',
        fullName: result.adminUser.fullName,
        role: SystemRoleSlug.PRINCIPAL,
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: 900,
      },
    };
  }

  /**
   * Resolve public institution information by slug, subdomain, or custom domain
   */
  async resolvePublicInfo(slugOrSubdomain: string): Promise<TenantPublicInfoResponseData> {
    const query = slugOrSubdomain.toLowerCase().trim();

    const tenant = await this.prisma.tenant.findFirst({
      where: {
        OR: [{ slug: query }, { subdomain: query }, { customDomain: query }],
        deletedAt: null,
      },
      include: {
        settings: true,
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Educational institution '${slugOrSubdomain}' not found`);
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subdomain: tenant.subdomain,
      logoUrl: tenant.settings?.logoUrl,
      primaryColor: tenant.settings?.primaryColor || '#1E40AF',
      timezone: tenant.settings?.timezone || 'Asia/Jakarta',
      currency: tenant.settings?.currency || 'IDR',
      isFormalEnabled: tenant.settings?.isFormalEnabled ?? true,
      isPesantrenEnabled: tenant.settings?.isPesantrenEnabled ?? true,
    };
  }

  /**
   * Get detailed tenant info including settings and active subscription
   */
  async getTenantDetails(tenantId: string): Promise<TenantDetailResponseData> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        settings: true,
        subscriptions: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID '${tenantId}' not found`);
    }

    const sub = tenant.subscriptions[0];

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      subdomain: tenant.subdomain,
      customDomain: tenant.customDomain,
      status: tenant.status as unknown as TenantStatus,
      settings: tenant.settings
        ? {
            logoUrl: tenant.settings.logoUrl,
            primaryColor: tenant.settings.primaryColor,
            timezone: tenant.settings.timezone,
            dateFormat: tenant.settings.dateFormat,
            currency: tenant.settings.currency,
            isFormalEnabled: tenant.settings.isFormalEnabled,
            isPesantrenEnabled: tenant.settings.isPesantrenEnabled,
          }
        : null,
      subscription: sub
        ? {
            tier: sub.tier as unknown as SubscriptionTier,
            maxStudents: sub.maxStudents,
            enabledModules: sub.enabledModules,
            startDate: sub.startDate,
            endDate: sub.endDate,
            isActive: sub.isActive,
          }
        : null,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  /**
   * Update tenant branding and preferences
   */
  async updateTenantSettings(
    tenantId: string,
    dto: UpdateTenantSettingsRequestDto,
  ): Promise<TenantDetailResponseData> {
    const current = await this.prisma.tenantSettings.findUnique({
      where: { tenantId },
    });

    await this.prisma.tenantSettings.upsert({
      where: { tenantId },
      create: {
        tenantId,
        logoUrl: dto.logoUrl,
        primaryColor: dto.primaryColor,
        timezone: dto.timezone || 'Asia/Jakarta',
        dateFormat: dto.dateFormat || 'DD/MM/YYYY',
        currency: dto.currency || 'IDR',
        isFormalEnabled: dto.isFormalEnabled ?? true,
        isPesantrenEnabled: dto.isPesantrenEnabled ?? true,
      },
      update: {
        logoUrl: dto.logoUrl !== undefined ? dto.logoUrl : current?.logoUrl,
        primaryColor: dto.primaryColor || current?.primaryColor,
        timezone: dto.timezone || current?.timezone,
        dateFormat: dto.dateFormat || current?.dateFormat,
        currency: dto.currency || current?.currency,
        isFormalEnabled:
          dto.isFormalEnabled !== undefined
            ? dto.isFormalEnabled
            : current?.isFormalEnabled,
        isPesantrenEnabled:
          dto.isPesantrenEnabled !== undefined
            ? dto.isPesantrenEnabled
            : current?.isPesantrenEnabled,
      },
    });

    return this.getTenantDetails(tenantId);
  }

  /**
   * List all tenants (Super Admin only)
   */
  async listAllTenants(limit = 100) {
    return this.prisma.tenant.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        settings: true,
        subscriptions: {
          where: { isActive: true },
          take: 1,
        },
        _count: {
          select: {
            users: true,
            students: true,
          },
        },
      },
    });
  }
}
