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
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import {
  CreateClassGroupDto,
  UpdateClassGroupDto,
  AssignStudentToClassDto,
} from '@edusaas/api-contracts';

@ApiTags('Master Data: Classes & Rombel')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/master-data/classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'List classes in institution' })
  async listClasses(
    @CurrentUser() user: any,
    @Query('academicYearId') academicYearId?: string,
  ) {
    return this.classesService.listClasses(user.tenantId, academicYearId);
  }

  @Get(':id')
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'Get class details and enrolled student roster' })
  async getClassById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.classesService.getClassById(user.tenantId, id);
  }

  @Post()
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create class group' })
  async createClass(
    @CurrentUser() user: any,
    @Body() dto: CreateClassGroupDto,
  ) {
    return this.classesService.createClass(user.tenantId, dto, user.id);
  }

  @Put(':id')
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update class group' })
  async updateClass(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateClassGroupDto,
  ) {
    return this.classesService.updateClass(user.tenantId, id, dto, user.id);
  }

  @Post('assign-student')
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Assign student to class' })
  async assignStudent(
    @CurrentUser() user: any,
    @Body() dto: AssignStudentToClassDto,
  ) {
    return this.classesService.assignStudent(user.tenantId, dto, user.id);
  }

  @Delete(':classId/students/:studentId')
  @RequirePermissions({ module: PermissionModule.MASTER_DATA, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Remove student from class' })
  async removeStudent(
    @CurrentUser() user: any,
    @Param('classId') classId: string,
    @Param('studentId') studentId: string,
  ) {
    return this.classesService.removeStudent(user.tenantId, classId, studentId, user.id);
  }
}
