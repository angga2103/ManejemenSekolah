import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SystemRoleSlug } from '@edusaas/shared-types';
import {
  RegisterTenantRequestDto,
  UpdateTenantSettingsRequestDto,
} from '@edusaas/api-contracts';

@ApiTags('Tenants & Institutions')
@Controller('api/v1/tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Public()
  @Post('register')
  @ApiOperation({
    summary: 'Public registration & automated provisioning of new School / Pesantren tenant',
  })
  async register(@Body() dto: RegisterTenantRequestDto) {
    return this.tenantsService.registerTenant(dto);
  }

  @Public()
  @Get('resolve/:slugOrSubdomain')
  @ApiOperation({
    summary: 'Public discovery & branding resolver by subdomain or slug',
  })
  async resolve(@Param('slugOrSubdomain') slugOrSubdomain: string) {
    return this.tenantsService.resolvePublicInfo(slugOrSubdomain);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('current')
  @ApiOperation({ summary: 'Get current tenant details and active subscription' })
  async getCurrent(@CurrentUser() user: any) {
    return this.tenantsService.getTenantDetails(user.tenantId);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
  @Roles(SystemRoleSlug.SUPER_ADMIN, SystemRoleSlug.PRINCIPAL)
  @Patch('current/settings')
  @ApiOperation({ summary: 'Update institutional branding and tenant settings' })
  async updateCurrentSettings(
    @CurrentUser() user: any,
    @Body() dto: UpdateTenantSettingsRequestDto,
  ) {
    return this.tenantsService.updateTenantSettings(user.tenantId, dto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(SystemRoleSlug.SUPER_ADMIN)
  @Get()
  @ApiOperation({
    summary: 'List all institutions (SaaS Super Admin / Developer Control Center only)',
  })
  async listAll() {
    return this.tenantsService.listAllTenants();
  }
}
