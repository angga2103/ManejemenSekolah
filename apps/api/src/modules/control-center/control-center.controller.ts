import {
  Controller,
  Get,
  Post,
  Patch,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ControlCenterService } from './control-center.service';
import { SubscriptionsService } from './subscriptions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRoleSlug, TenantStatus, SubscriptionTier } from '@edusaas/shared-types';
import {
  UpdateTenantStatusDto,
  UpdateTenantModulesDto,
  UpdateTenantSubscriptionDto,
  RenewSubscriptionDto,
  GenerateLicenseKeyDto,
} from '@edusaas/api-contracts';

@ApiTags('SaaS Developer Control Center & Subscriptions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/control-center')
export class ControlCenterController {
  constructor(
    private readonly controlCenterService: ControlCenterService,
    private readonly subscriptionsService: SubscriptionsService,
  ) {}

  @Roles(SystemRoleSlug.SUPER_ADMIN)
  @Get('metrics')
  @ApiOperation({ summary: 'Get live SaaS performance metrics, DB latency & totals' })
  async getMetrics() {
    return this.controlCenterService.getSystemMetrics();
  }

  @Roles(SystemRoleSlug.SUPER_ADMIN)
  @Get('tenants')
  @ApiOperation({ summary: 'List all institutions with quota usage & subscription state' })
  async listTenants(
    @Query('search') search?: string,
    @Query('status') status?: TenantStatus,
    @Query('tier') tier?: SubscriptionTier,
  ) {
    return this.controlCenterService.listTenantsSummary({ search, status, tier });
  }

  @Roles(SystemRoleSlug.SUPER_ADMIN)
  @Patch('tenants/:tenantId/status')
  @ApiOperation({ summary: 'Update institution status (ACTIVE, SUSPENDED, TERMINATED)' })
  async updateStatus(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantStatusDto,
    @CurrentUser() user: any,
  ) {
    return this.controlCenterService.updateTenantStatus(tenantId, dto, user.sub);
  }

  @Roles(SystemRoleSlug.SUPER_ADMIN, SystemRoleSlug.PRINCIPAL)
  @Get('tenants/:tenantId/subscription')
  @ApiOperation({ summary: 'Get active subscription and quota for a tenant' })
  async getSubscription(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.getTenantSubscription(tenantId);
  }

  @Roles(SystemRoleSlug.SUPER_ADMIN)
  @Post('tenants/:tenantId/subscriptions/renew')
  @ApiOperation({ summary: 'Renew or extend an institutional subscription' })
  async renewSubscription(
    @Param('tenantId') tenantId: string,
    @Body() dto: RenewSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.renewSubscription(tenantId, dto, user.sub);
  }

  @Roles(SystemRoleSlug.SUPER_ADMIN)
  @Patch('tenants/:tenantId/subscriptions')
  @ApiOperation({ summary: 'Update subscription properties (tier, quota, dates)' })
  async updateSubscription(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantSubscriptionDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.updateSubscription(tenantId, dto, user.sub);
  }

  @Roles(SystemRoleSlug.SUPER_ADMIN)
  @Put('tenants/:tenantId/modules')
  @ApiOperation({ summary: 'Configure enabled SaaS module flags for tenant' })
  async updateModules(
    @Param('tenantId') tenantId: string,
    @Body() dto: UpdateTenantModulesDto,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.updateModules(tenantId, dto.enabledModules, user.sub);
  }

  @Roles(SystemRoleSlug.SUPER_ADMIN)
  @Post('tenants/:tenantId/license-key')
  @ApiOperation({ summary: 'Generate a cryptographically verifiable license key' })
  async generateLicenseKey(@Param('tenantId') tenantId: string) {
    return this.subscriptionsService.generateLicenseKey(tenantId);
  }

  @Roles(SystemRoleSlug.SUPER_ADMIN)
  @Get('audit-logs')
  @ApiOperation({ summary: 'Query cross-tenant audit trail with user & tenant details' })
  async getAuditLogs(
    @Query('limit') limit?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 100;
    return this.controlCenterService.getCrossTenantAuditLogs(limitNum, tenantId);
  }

  @Roles(SystemRoleSlug.SUPER_ADMIN, SystemRoleSlug.PRINCIPAL)
  @Get('verify-module/:moduleKey')
  @ApiOperation({ summary: 'Verify if institutional tenant has entitlement for module' })
  async verifyModule(
    @Param('moduleKey') moduleKey: string,
    @CurrentUser() user: any,
  ) {
    return this.subscriptionsService.verifyModuleAccess(user.tenantId, moduleKey);
  }
}
