import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DisciplineService } from './discipline.service';
import { CounselingService } from './counseling.service';
import { ComplaintService } from './complaint.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionAction, PermissionModule } from '@edusaas/shared-types';
import {
  RecordViolationDto,
  RecordAchievementDto,
  CreateCounselingSessionDto,
  CreateComplaintDto,
  ResolveComplaintDto,
  CreateAnnouncementDto,
} from '@edusaas/api-contracts';

@Controller('communication')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CommunicationController {
  constructor(
    private readonly disciplineService: DisciplineService,
    private readonly counselingService: CounselingService,
    private readonly complaintService: ComplaintService
  ) {}

  // ===========================================================================
  // DISCIPLINE & VIOLATIONS
  // ===========================================================================

  @Post('violations')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.CREATE })
  recordViolation(@Req() req: any, @Body() dto: RecordViolationDto) {
    return this.disciplineService.recordViolation(req.user.tenantId, dto);
  }

  @Get('violations')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.VIEW })
  listViolations(
    @Req() req: any,
    @Query('studentId') studentId?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    return this.disciplineService.listViolations(req.user.tenantId, {
      studentId,
      fromDate,
      toDate,
    });
  }

  @Get('students/:studentId/discipline')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.VIEW })
  getStudentDisciplineSummary(@Req() req: any, @Param('studentId') studentId: string) {
    return this.disciplineService.getStudentDisciplineSummary(req.user.tenantId, studentId);
  }

  // ===========================================================================
  // ACHIEVEMENTS
  // ===========================================================================

  @Post('achievements')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.CREATE })
  recordAchievement(@Req() req: any, @Body() dto: RecordAchievementDto) {
    return this.disciplineService.recordAchievement(req.user.tenantId, dto);
  }

  @Get('achievements')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.VIEW })
  listAchievements(
    @Req() req: any,
    @Query('studentId') studentId?: string,
    @Query('level') level?: string
  ) {
    return this.disciplineService.listAchievements(req.user.tenantId, {
      studentId,
      level,
    });
  }

  // ===========================================================================
  // COUNSELING (BK) - STRICT PRIVACY PERMISSION
  // ===========================================================================

  @Post('counseling')
  @RequirePermissions({ module: PermissionModule.COUNSELING, action: PermissionAction.CREATE })
  createCounselingSession(@Req() req: any, @Body() dto: CreateCounselingSessionDto) {
    return this.counselingService.createSession(req.user.tenantId, dto);
  }

  @Get('counseling')
  @RequirePermissions({ module: PermissionModule.COUNSELING, action: PermissionAction.VIEW })
  listCounselingSessions(
    @Req() req: any,
    @Query('studentId') studentId?: string,
    @Query('counselorId') counselorId?: string,
    @Query('followUpOnly') followUpOnly?: string
  ) {
    return this.counselingService.listSessions(req.user.tenantId, {
      studentId,
      counselorId,
      followUpOnly: followUpOnly === 'true',
    });
  }

  @Get('counseling/:id')
  @RequirePermissions({ module: PermissionModule.COUNSELING, action: PermissionAction.VIEW })
  getCounselingSessionById(@Req() req: any, @Param('id') id: string) {
    return this.counselingService.getSessionById(req.user.tenantId, id);
  }

  // ===========================================================================
  // COMPLAINT DESK & ANNOUNCEMENTS
  // ===========================================================================

  @Post('complaints')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.CREATE })
  createComplaint(@Req() req: any, @Body() dto: CreateComplaintDto) {
    return this.complaintService.createComplaint(req.user.tenantId, req.user.userId, dto);
  }

  @Get('complaints')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.VIEW })
  listComplaints(
    @Req() req: any,
    @Query('userId') userId?: string,
    @Query('status') status?: any,
    @Query('priority') priority?: any,
    @Query('category') category?: string
  ) {
    return this.complaintService.listComplaints(req.user.tenantId, {
      userId,
      status,
      priority,
      category,
    });
  }

  @Patch('complaints/:id/resolve')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.UPDATE })
  resolveComplaint(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ResolveComplaintDto
  ) {
    return this.complaintService.resolveComplaint(req.user.tenantId, id, dto);
  }

  @Post('announcements')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.CREATE })
  createAnnouncement(@Req() req: any, @Body() dto: CreateAnnouncementDto) {
    return this.complaintService.createAnnouncement(req.user.tenantId, dto);
  }

  @Get('announcements')
  @RequirePermissions({ module: PermissionModule.COMMUNICATION, action: PermissionAction.VIEW })
  listAnnouncements(@Req() req: any, @Query('targetAudience') targetAudience?: string) {
    return this.complaintService.listAnnouncements(req.user.tenantId, targetAudience);
  }
}
