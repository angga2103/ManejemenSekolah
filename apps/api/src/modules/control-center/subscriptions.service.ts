import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import {
  UpdateTenantSubscriptionDto,
  RenewSubscriptionDto,
  TenantSubscriptionInfo,
  LicenseKeyResponseData,
} from '@edusaas/api-contracts';
import {
  SubscriptionTier,
  TenantStatus,
  SaaSModuleKey,
} from '@edusaas/shared-types';

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get active subscription details and quota info for a tenant
   */
  async getTenantSubscription(tenantId: string): Promise<TenantSubscriptionInfo> {
    const sub = await this.prisma.tenantSubscription.findFirst({
      where: {
        tenantId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) {
      throw new NotFoundException(`No active subscription found for tenant '${tenantId}'`);
    }

    const now = new Date();
    const diffTime = sub.endDate.getTime() - now.getTime();
    const daysRemaining = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

    return {
      id: sub.id,
      tier: sub.tier as unknown as SubscriptionTier,
      maxStudents: sub.maxStudents,
      enabledModules: sub.enabledModules,
      startDate: sub.startDate,
      endDate: sub.endDate,
      isActive: sub.isActive,
      daysRemaining,
    };
  }

  /**
   * Renew or extend an existing active subscription
   */
  async renewSubscription(
    tenantId: string,
    dto: RenewSubscriptionDto,
    userId?: string,
  ): Promise<TenantSubscriptionInfo> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }

    const monthsToAdd = dto.months || 12;
    const currentSub = tenant.subscriptions[0];

    const baseDate = currentSub && currentSub.endDate > new Date()
      ? new Date(currentSub.endDate)
      : new Date();

    const newEndDate = new Date(baseDate);
    newEndDate.setMonth(newEndDate.getMonth() + monthsToAdd);

    const tier = dto.tier || currentSub?.tier || SubscriptionTier.STANDARD;
    const maxStudents = dto.maxStudents || currentSub?.maxStudents || (tier === SubscriptionTier.ENTERPRISE ? 3000 : 1000);

    let updatedSub;

    if (currentSub) {
      updatedSub = await this.prisma.tenantSubscription.update({
        where: { id: currentSub.id },
        data: {
          tier: tier as any,
          maxStudents,
          endDate: newEndDate,
          isActive: true,
        },
      });
    } else {
      updatedSub = await this.prisma.tenantSubscription.create({
        data: {
          tenantId,
          tier: tier as any,
          maxStudents,
          enabledModules: [
            SaaSModuleKey.MASTER_DATA,
            SaaSModuleKey.ATTENDANCE,
            SaaSModuleKey.FINANCE,
            SaaSModuleKey.ACADEMICS,
            SaaSModuleKey.PESANTREN,
            SaaSModuleKey.COMMUNICATION,
          ],
          startDate: new Date(),
          endDate: newEndDate,
          isActive: true,
        },
      });
    }

    // Ensure tenant status is ACTIVE if currently suspended or trial
    if (tenant.status !== TenantStatus.ACTIVE) {
      await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { status: TenantStatus.ACTIVE as any },
      });
    }

    await this.auditService.record({
      tenantId,
      userId: userId || null,
      action: 'SUBSCRIPTION_RENEWED',
      resource: 'tenant_subscriptions',
      resourceId: updatedSub.id,
      newValues: {
        tier: updatedSub.tier,
        maxStudents: updatedSub.maxStudents,
        endDate: updatedSub.endDate,
        monthsAdded: monthsToAdd,
      },
    });

    return this.getTenantSubscription(tenantId);
  }

  /**
   * Update subscription properties (tier, quota, dates, active flag)
   */
  async updateSubscription(
    tenantId: string,
    dto: UpdateTenantSubscriptionDto,
    userId?: string,
  ): Promise<TenantSubscriptionInfo> {
    const currentSub = await this.prisma.tenantSubscription.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!currentSub) {
      throw new NotFoundException(`Active subscription for tenant '${tenantId}' not found`);
    }

    const data: any = {};
    if (dto.tier) data.tier = dto.tier;
    if (dto.maxStudents) data.maxStudents = dto.maxStudents;
    if (dto.enabledModules) data.enabledModules = dto.enabledModules;
    if (dto.startDate) data.startDate = new Date(dto.startDate);
    if (dto.endDate) data.endDate = new Date(dto.endDate);
    if (dto.isActive !== undefined) data.isActive = dto.isActive;

    const updated = await this.prisma.tenantSubscription.update({
      where: { id: currentSub.id },
      data,
    });

    await this.auditService.record({
      tenantId,
      userId: userId || null,
      action: 'SUBSCRIPTION_UPDATED',
      resource: 'tenant_subscriptions',
      resourceId: updated.id,
      oldValues: {
        tier: currentSub.tier,
        maxStudents: currentSub.maxStudents,
        enabledModules: currentSub.enabledModules,
      },
      newValues: data,
    });

    return this.getTenantSubscription(tenantId);
  }

  /**
   * Enable or disable module feature flags for a tenant
   */
  async updateModules(
    tenantId: string,
    enabledModules: string[],
    userId?: string,
  ): Promise<TenantSubscriptionInfo> {
    const sub = await this.prisma.tenantSubscription.findFirst({
      where: { tenantId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!sub) {
      throw new NotFoundException(`No active subscription found for tenant '${tenantId}'`);
    }

    // Clean and validate unique module keys
    const validKeys = Object.values(SaaSModuleKey) as string[];
    const cleanedModules = Array.from(new Set(enabledModules.map((m) => m.toUpperCase().trim())));

    const invalid = cleanedModules.filter((m) => !validKeys.includes(m));
    if (invalid.length > 0) {
      throw new BadRequestException(`Invalid module key(s): ${invalid.join(', ')}`);
    }

    await this.prisma.tenantSubscription.update({
      where: { id: sub.id },
      data: { enabledModules: cleanedModules },
    });

    await this.auditService.record({
      tenantId,
      userId: userId || null,
      action: 'MODULE_FLAGS_UPDATED',
      resource: 'tenant_subscriptions',
      resourceId: sub.id,
      newValues: { enabledModules: cleanedModules },
    });

    return this.getTenantSubscription(tenantId);
  }

  /**
   * Verify if a tenant has access to a specific module and valid quota
   */
  async verifyModuleAccess(
    tenantId: string,
    moduleKey: string,
  ): Promise<{ allowed: boolean; reason?: string }> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!tenant) {
      return { allowed: false, reason: 'Institution does not exist' };
    }

    if (tenant.status === TenantStatus.SUSPENDED) {
      return { allowed: false, reason: 'Institution subscription is currently suspended' };
    }

    if (tenant.status === TenantStatus.TERMINATED) {
      return { allowed: false, reason: 'Institution subscription has been terminated' };
    }

    const sub = tenant.subscriptions[0];
    if (!sub) {
      return { allowed: false, reason: 'No active subscription found' };
    }

    if (new Date() > sub.endDate) {
      return { allowed: false, reason: 'Subscription period has expired' };
    }

    const upperKey = moduleKey.toUpperCase();
    if (!sub.enabledModules.includes(upperKey)) {
      return {
        allowed: false,
        reason: `Module '${upperKey}' is not enabled in institutional license`,
      };
    }

    return { allowed: true };
  }

  /**
   * Generate an offline-verifiable cryptographically signed license key
   */
  async generateLicenseKey(tenantId: string): Promise<LicenseKeyResponseData> {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      include: {
        subscriptions: {
          where: { isActive: true },
          take: 1,
        },
      },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant '${tenantId}' not found`);
    }

    const sub = tenant.subscriptions[0];
    if (!sub) {
      throw new BadRequestException(`Cannot issue license key: Tenant has no active subscription`);
    }

    const secret =
      this.configService.get<string>('JWT_SECRET') ||
      'dev_super_secret_jwt_key_do_not_use_in_production_min_length_32_chars_12345';

    const payload = {
      tenantId: tenant.id,
      slug: tenant.slug,
      tier: sub.tier,
      maxStudents: sub.maxStudents,
      enabledModules: sub.enabledModules,
      validUntil: sub.endDate.toISOString(),
      issuedAt: new Date().toISOString(),
    };

    const payloadStr = JSON.stringify(payload);
    const signature = crypto.createHmac('sha256', secret).update(payloadStr).digest('hex');

    const encodedPayload = Buffer.from(payloadStr).toString('base64url');
    const licenseKey = `EDU-${sub.tier}-${tenant.slug.toUpperCase()}-${signature.slice(0, 16).toUpperCase()}.${encodedPayload}`;

    await this.auditService.record({
      tenantId,
      action: 'LICENSE_KEY_GENERATED',
      resource: 'license_keys',
      newValues: { tier: sub.tier, validUntil: sub.endDate },
    });

    return {
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      tier: sub.tier as unknown as SubscriptionTier,
      maxStudents: sub.maxStudents,
      enabledModules: sub.enabledModules,
      validUntil: sub.endDate.toISOString(),
      licenseKey,
      signature,
    };
  }
}
