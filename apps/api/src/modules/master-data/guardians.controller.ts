import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GuardiansService } from './guardians.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import {
  CreateGuardianDto,
  LinkStudentGuardianDto,
  UpdateStudentGuardianDto,
} from '@edusaas/api-contracts';

@ApiTags('Master Data: Guardians (Wali Santri / Orang Tua)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/master-data/guardians')
export class GuardiansController {
  constructor(private readonly guardiansService: GuardiansService) {}

  @Get()
  @RequirePermissions({ module: PermissionModule.GUARDIANS, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'List guardians in institution' })
  async listGuardians(
    @CurrentUser() user: any,
    @Query('search') search?: string,
  ) {
    return this.guardiansService.listGuardians(user.tenantId, search);
  }

  @Get(':id')
  @RequirePermissions({ module: PermissionModule.GUARDIANS, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'Get guardian details and linked students' })
  async getGuardianById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.guardiansService.getGuardianById(user.tenantId, id);
  }

  @Post()
  @RequirePermissions({ module: PermissionModule.GUARDIANS, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create guardian and provision user login account' })
  async createGuardian(
    @CurrentUser() user: any,
    @Body() dto: CreateGuardianDto,
  ) {
    return this.guardiansService.createGuardian(user.tenantId, dto, user.id);
  }

  @Post('link')
  @RequirePermissions({ module: PermissionModule.GUARDIANS, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Link student with guardian (supports 1:N and N:M)' })
  async linkStudentGuardian(
    @CurrentUser() user: any,
    @Body() dto: LinkStudentGuardianDto,
  ) {
    return this.guardiansService.linkStudentGuardian(user.tenantId, dto, user.id);
  }

  @Put('link/:linkId')
  @RequirePermissions({ module: PermissionModule.GUARDIANS, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update student-guardian relationship preferences' })
  async updateStudentGuardianLink(
    @CurrentUser() user: any,
    @Param('linkId') linkId: string,
    @Body() dto: UpdateStudentGuardianDto,
  ) {
    return this.guardiansService.updateStudentGuardianLink(user.tenantId, linkId, dto, user.id);
  }

  @Delete('link/:linkId')
  @RequirePermissions({ module: PermissionModule.GUARDIANS, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Unlink student from guardian' })
  async unlinkStudentGuardian(
    @CurrentUser() user: any,
    @Param('linkId') linkId: string,
  ) {
    return this.guardiansService.unlinkStudentGuardian(user.tenantId, linkId, user.id);
  }
}
