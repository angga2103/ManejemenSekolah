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
import { InstitutionsService } from './institutions.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import {
  CreateInstitutionDto,
  CreateAcademicYearDto,
} from '@edusaas/api-contracts';

@ApiTags('Master Data: Institutions & Academic Periods')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('master-data')
export class InstitutionsController {
  constructor(private readonly institutionsService: InstitutionsService) {}

  @Get('institutions')
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'List institutional units (Formal / Pesantren)' })
  async listInstitutions(@CurrentUser() user: any) {
    return this.institutionsService.listInstitutions(user.tenantId);
  }

  @Post('institutions')
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create institutional unit' })
  async createInstitution(
    @CurrentUser() user: any,
    @Body() dto: CreateInstitutionDto,
  ) {
    return this.institutionsService.createInstitution(user.tenantId, dto, user.id);
  }

  @Get('academic-years')
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'List academic years and semesters' })
  async listAcademicYears(@CurrentUser() user: any) {
    return this.institutionsService.listAcademicYears(user.tenantId);
  }

  @Post('academic-years')
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create academic year' })
  async createAcademicYear(
    @CurrentUser() user: any,
    @Body() dto: CreateAcademicYearDto,
  ) {
    return this.institutionsService.createAcademicYear(user.tenantId, dto, user.id);
  }

  @Patch('academic-years/:id/activate')
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Activate academic year' })
  async setActiveAcademicYear(@CurrentUser() user: any, @Param('id') id: string) {
    return this.institutionsService.setActiveAcademicYear(user.tenantId, id, user.id);
  }
}
