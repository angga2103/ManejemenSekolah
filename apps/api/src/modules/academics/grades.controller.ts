import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { GradesService } from './grades.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import {
  CreateGradeDto,
  BatchInputGradesDto,
  GradeFilterDto,
} from '@edusaas/api-contracts';

@Controller('grades')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class GradesController {
  constructor(private readonly gradesService: GradesService) {}

  @Post()
  @RequirePermissions({ module: PermissionModule.ACADEMICS, action: PermissionAction.CREATE })
  async recordGrade(@Req() req: any, @Body() dto: CreateGradeDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.gradesService.recordGrade(tenantId, userId, dto);
  }

  @Post('batch')
  @RequirePermissions({ module: PermissionModule.ACADEMICS, action: PermissionAction.CREATE })
  async batchInputGrades(@Req() req: any, @Body() dto: BatchInputGradesDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.gradesService.batchInputGrades(tenantId, userId, dto);
  }

  @Get()
  @RequirePermissions({ module: PermissionModule.ACADEMICS, action: PermissionAction.VIEW })
  async findAll(@Req() req: any, @Query() filter: GradeFilterDto) {
    const tenantId = req.user.tenantId;
    return this.gradesService.findAll(tenantId, filter);
  }

  @Get('students/:studentId/summary')
  @RequirePermissions({ module: PermissionModule.ACADEMICS, action: PermissionAction.VIEW })
  async getStudentSubjectSummary(
    @Req() req: any,
    @Param('studentId') studentId: string,
    @Query('academicYearId') academicYearId: string,
    @Query('kkm') kkm?: number,
  ) {
    const tenantId = req.user.tenantId;
    return this.gradesService.calculateStudentSubjectScores(
      tenantId,
      studentId,
      academicYearId,
      kkm ? Number(kkm) : 75,
    );
  }
}
