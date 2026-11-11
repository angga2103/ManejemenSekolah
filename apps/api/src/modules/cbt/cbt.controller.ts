import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { CbtService } from './cbt.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction, SystemRoleSlug } from '@edusaas/shared-types';
import {
  CreateQuestionBankDto,
  CreateExamQuestionDto,
  CreateExamDto,
  ExamFilterDto,
  StartExamSessionDto,
  SubmitExamAnswerDto,
} from '@edusaas/api-contracts';

@Controller('cbt')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class CbtController {
  constructor(private readonly service: CbtService) {}

  // ---------------------------------------------------------------------------
  // QUESTION BANKS & QUESTIONS
  // ---------------------------------------------------------------------------

  @Post('banks')
  @RequirePermissions({ module: PermissionModule.EXAMINATIONS, action: PermissionAction.CREATE })
  async createQuestionBank(@Req() req: any, @Body() dto: CreateQuestionBankDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.createQuestionBank(tenantId, userId, dto);
  }

  @Get('banks')
  @RequirePermissions({ module: PermissionModule.EXAMINATIONS, action: PermissionAction.VIEW })
  async findQuestionBanks(@Req() req: any, @Query('subjectId') subjectId?: string) {
    const tenantId = req.user.tenantId;
    return this.service.findQuestionBanks(tenantId, subjectId);
  }

  @Post('questions')
  @RequirePermissions({ module: PermissionModule.EXAMINATIONS, action: PermissionAction.CREATE })
  async createExamQuestion(@Req() req: any, @Body() dto: CreateExamQuestionDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.createExamQuestion(tenantId, userId, dto);
  }

  @Get('banks/:bankId/questions')
  @RequirePermissions({ module: PermissionModule.EXAMINATIONS, action: PermissionAction.VIEW })
  async findQuestionsByBank(@Req() req: any, @Param('bankId') bankId: string) {
    const tenantId = req.user.tenantId;
    const isStudent = req.user.roles?.includes(SystemRoleSlug.STUDENT);
    return this.service.findQuestionsByBank(tenantId, bankId, !isStudent);
  }

  // ---------------------------------------------------------------------------
  // EXAM PACKAGES
  // ---------------------------------------------------------------------------

  @Post('exams')
  @RequirePermissions({ module: PermissionModule.EXAMINATIONS, action: PermissionAction.CREATE })
  async createExam(@Req() req: any, @Body() dto: CreateExamDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.createExam(tenantId, userId, dto);
  }

  @Get('exams')
  @RequirePermissions({ module: PermissionModule.EXAMINATIONS, action: PermissionAction.VIEW })
  async findExams(@Req() req: any, @Query() filter: ExamFilterDto) {
    const tenantId = req.user.tenantId;
    const isStudent = req.user.roles?.includes(SystemRoleSlug.STUDENT);
    const studentUserId = isStudent ? req.user.userId : undefined;
    return this.service.findExams(tenantId, filter, studentUserId);
  }

  // ---------------------------------------------------------------------------
  // STUDENT CBT SESSIONS & ANSWERS
  // ---------------------------------------------------------------------------

  @Post('sessions/start')
  @RequirePermissions({ module: PermissionModule.EXAMINATIONS, action: PermissionAction.CREATE })
  async startExamSession(@Req() req: any, @Body() dto: StartExamSessionDto) {
    const tenantId = req.user.tenantId;
    const studentUserId = req.user.userId;
    return this.service.startExamSession(tenantId, studentUserId, dto);
  }

  @Post('sessions/:id/answers')
  @RequirePermissions({ module: PermissionModule.EXAMINATIONS, action: PermissionAction.CREATE })
  async submitAnswer(
    @Req() req: any,
    @Param('id') sessionId: string,
    @Body() dto: SubmitExamAnswerDto,
  ) {
    const tenantId = req.user.tenantId;
    const studentUserId = req.user.userId;
    return this.service.submitAnswer(tenantId, studentUserId, sessionId, dto);
  }

  @Post('sessions/:id/finish')
  @RequirePermissions({ module: PermissionModule.EXAMINATIONS, action: PermissionAction.CREATE })
  async finishExamSession(@Req() req: any, @Param('id') sessionId: string) {
    const tenantId = req.user.tenantId;
    const studentUserId = req.user.userId;
    return this.service.finishExamSession(tenantId, studentUserId, sessionId);
  }
}
