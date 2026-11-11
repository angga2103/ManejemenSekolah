import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { LmsService } from './lms.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction, SystemRoleSlug } from '@edusaas/shared-types';
import {
  CreateCourseMaterialDto,
  CourseMaterialFilterDto,
  CreateAssignmentDto,
  AssignmentFilterDto,
  SubmitAssignmentDto,
  GradeAssignmentDto,
} from '@edusaas/api-contracts';

@Controller('lms')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class LmsController {
  constructor(private readonly service: LmsService) {}

  // ---------------------------------------------------------------------------
  // COURSE MATERIALS
  // ---------------------------------------------------------------------------

  @Post('materials')
  @RequirePermissions({ module: PermissionModule.LMS, action: PermissionAction.CREATE })
  async createMaterial(@Req() req: any, @Body() dto: CreateCourseMaterialDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.createMaterial(tenantId, userId, dto);
  }

  @Get('materials')
  @RequirePermissions({ module: PermissionModule.LMS, action: PermissionAction.VIEW })
  async findMaterials(@Req() req: any, @Query() filter: CourseMaterialFilterDto) {
    const tenantId = req.user.tenantId;
    const isStudent = req.user.roles?.includes(SystemRoleSlug.STUDENT);
    const studentUserId = isStudent ? req.user.userId : undefined;
    return this.service.findMaterials(tenantId, filter, studentUserId);
  }

  @Get('materials/:id')
  @RequirePermissions({ module: PermissionModule.LMS, action: PermissionAction.VIEW })
  async findMaterialById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.service.findMaterialById(tenantId, id);
  }

  // ---------------------------------------------------------------------------
  // ASSIGNMENTS & SUBMISSIONS
  // ---------------------------------------------------------------------------

  @Post('assignments')
  @RequirePermissions({ module: PermissionModule.LMS, action: PermissionAction.CREATE })
  async createAssignment(@Req() req: any, @Body() dto: CreateAssignmentDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.createAssignment(tenantId, userId, dto);
  }

  @Get('assignments')
  @RequirePermissions({ module: PermissionModule.LMS, action: PermissionAction.VIEW })
  async findAssignments(@Req() req: any, @Query() filter: AssignmentFilterDto) {
    const tenantId = req.user.tenantId;
    const isStudent = req.user.roles?.includes(SystemRoleSlug.STUDENT);
    const studentUserId = isStudent ? req.user.userId : undefined;
    return this.service.findAssignments(tenantId, filter, studentUserId);
  }

  @Post('assignments/:id/submit')
  @RequirePermissions({ module: PermissionModule.LMS, action: PermissionAction.CREATE })
  async submitAssignment(
    @Req() req: any,
    @Param('id') assignmentId: string,
    @Body() dto: SubmitAssignmentDto,
  ) {
    const tenantId = req.user.tenantId;
    const studentUserId = req.user.userId;
    return this.service.submitAssignment(tenantId, studentUserId, assignmentId, dto);
  }

  @Put('submissions/:id/grade')
  @RequirePermissions({ module: PermissionModule.LMS, action: PermissionAction.UPDATE })
  async gradeSubmission(
    @Req() req: any,
    @Param('id') submissionId: string,
    @Body() dto: GradeAssignmentDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.gradeSubmission(tenantId, userId, submissionId, dto);
  }
}
