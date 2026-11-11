import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Param,
  UseGuards,
  Req,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { ReportCardsService } from './report-cards.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction, SystemRoleSlug } from '@edusaas/shared-types';
import {
  GenerateReportCardDto,
  GenerateBatchReportCardsDto,
  ReportCardFilterDto,
} from '@edusaas/api-contracts';

@Controller('report-cards')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class ReportCardsController {
  constructor(private readonly reportCardsService: ReportCardsService) {}

  @Post('generate')
  @RequirePermissions({ module: PermissionModule.ACADEMICS, action: PermissionAction.CREATE })
  async generateReportCard(@Req() req: any, @Body() dto: GenerateReportCardDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.reportCardsService.generateReportCard(tenantId, userId, dto);
  }

  @Post('generate-batch')
  @RequirePermissions({ module: PermissionModule.ACADEMICS, action: PermissionAction.CREATE })
  async generateBatchReportCards(
    @Req() req: any,
    @Body() dto: GenerateBatchReportCardsDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.reportCardsService.generateBatchReportCards(tenantId, userId, dto);
  }

  @Get()
  @RequirePermissions({ module: PermissionModule.ACADEMICS, action: PermissionAction.VIEW })
  async findAll(@Req() req: any, @Query() filter: ReportCardFilterDto) {
    const tenantId = req.user.tenantId;
    const isParent = req.user.roles?.includes(SystemRoleSlug.PARENT);
    const isStudent = req.user.roles?.includes(SystemRoleSlug.STUDENT);

    const guardianUserId = isParent ? req.user.userId : undefined;
    const studentUserId = isStudent ? req.user.userId : undefined;

    return this.reportCardsService.findAll(
      tenantId,
      filter,
      guardianUserId,
      studentUserId,
    );
  }

  @Get(':id')
  @RequirePermissions({ module: PermissionModule.ACADEMICS, action: PermissionAction.VIEW })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    const isParent = req.user.roles?.includes(SystemRoleSlug.PARENT);
    const isStudent = req.user.roles?.includes(SystemRoleSlug.STUDENT);

    const guardianUserId = isParent ? req.user.userId : undefined;
    const studentUserId = isStudent ? req.user.userId : undefined;

    return this.reportCardsService.findById(
      tenantId,
      id,
      guardianUserId,
      studentUserId,
    );
  }

  @Get(':id/print')
  @RequirePermissions({ module: PermissionModule.ACADEMICS, action: PermissionAction.VIEW })
  async printReportCard(
    @Req() req: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const tenantId = req.user.tenantId;
    const html = await this.reportCardsService.renderReportCardHtml(tenantId, id);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.send(html);
  }
}
