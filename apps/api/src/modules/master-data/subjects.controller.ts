import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import { CreateSubjectDto } from '@edusaas/api-contracts';

@ApiTags('Master Data: Subjects & Curricula')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('master-data/subjects')
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'List subjects (Formal & Diniyah)' })
  async listSubjects(
    @CurrentUser() user: any,
    @Query('institutionId') institutionId?: string,
  ) {
    return this.subjectsService.listSubjects(user.tenantId, institutionId);
  }

  @Post()
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create subject' })
  async createSubject(
    @CurrentUser() user: any,
    @Body() dto: CreateSubjectDto,
  ) {
    return this.subjectsService.createSubject(user.tenantId, dto, user.id);
  }
}
