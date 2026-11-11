import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { RbacService } from './rbac.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { SystemRoleSlug } from '@edusaas/shared-types';
import {
  CreateRoleRequestDto,
  UpdateRolePermissionsRequestDto,
} from '@edusaas/api-contracts';

@ApiTags('RBAC & Permissions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/rbac')
export class RbacController {
  constructor(private readonly rbacService: RbacService) {}

  @Public()
  @Get('permissions')
  @ApiOperation({ summary: 'List all available permissions catalog' })
  async getPermissions() {
    return this.rbacService.getPermissionsCatalog();
  }

  @Get('roles')
  @ApiOperation({ summary: 'List all roles configured for active tenant' })
  async getRoles(@CurrentUser() user: any) {
    const tenantId = user.tenantId;
    return this.rbacService.getRoles(tenantId);
  }

  @Get('roles/:id')
  @ApiOperation({ summary: 'Get single role details and permissions' })
  async getRoleById(@CurrentUser() user: any, @Param('id') roleId: string) {
    const tenantId = user.tenantId;
    return this.rbacService.getRoleById(tenantId, roleId);
  }

  @Post('roles')
  @Roles(SystemRoleSlug.SUPER_ADMIN, SystemRoleSlug.PRINCIPAL)
  @ApiOperation({ summary: 'Create custom role for active tenant' })
  async createRole(
    @CurrentUser() user: any,
    @Body() dto: CreateRoleRequestDto,
  ) {
    const tenantId = user.tenantId;
    return this.rbacService.createRole(tenantId, dto);
  }

  @Put('roles/:id/permissions')
  @Roles(SystemRoleSlug.SUPER_ADMIN, SystemRoleSlug.PRINCIPAL)
  @ApiOperation({ summary: 'Update permissions assigned to a role' })
  async updateRolePermissions(
    @CurrentUser() user: any,
    @Param('id') roleId: string,
    @Body() dto: UpdateRolePermissionsRequestDto,
  ) {
    const tenantId = user.tenantId;
    return this.rbacService.updateRolePermissions(tenantId, roleId, dto);
  }
}
