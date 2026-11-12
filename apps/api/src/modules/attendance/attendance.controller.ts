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
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction, AttendanceType } from '@edusaas/shared-types';
import {
  GenerateDynamicQrDto,
  VerifyDynamicQrDto,
  RecordAttendanceDto,
  ManualClassRollCallDto,
  AttendanceCorrectionDto,
  AttendanceFilterDto,
  OfflineSyncBatchRequestDto,
} from '@edusaas/api-contracts';

@Controller('attendance')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Post('dynamic-qr')
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.CREATE })
  async generateDynamicQr(
    @Req() req: any,
    @Body() dto: GenerateDynamicQrDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.attendanceService.generateDynamicQr(tenantId, dto);
  }

  @Post('scan-qr')
  async verifyDynamicQr(
    @Req() req: any,
    @Body() dto: VerifyDynamicQrDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.attendanceService.verifyAndRecordDynamicQr(tenantId, dto, req.user);
  }

  @Post('record')
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.CREATE })
  async recordAttendance(
    @Req() req: any,
    @Body() dto: RecordAttendanceDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.attendanceService.recordAttendance(tenantId, dto);
  }

  @Post('manual-roll-call')
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.CREATE })
  async recordManualRollCall(
    @Req() req: any,
    @Body() dto: ManualClassRollCallDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.attendanceService.recordManualRollCall(tenantId, userId, dto);
  }

  @Patch(':id/correction')
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.UPDATE })
  async correctAttendance(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AttendanceCorrectionDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.attendanceService.correctAttendance(tenantId, userId, id, dto);
  }

  @Post('sync')
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.CREATE })
  async syncBatch(
    @Req() req: any,
    @Body() dto: OfflineSyncBatchRequestDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.attendanceService.processOfflineSyncBatch(tenantId, dto);
  }

  @Get('summary')
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.VIEW })
  async getSummary(
    @Req() req: any,
    @Query('date') date?: string,
    @Query('type') type?: string,
  ) {
    const tenantId = req.user.tenantId;
    const recordedDate = date || new Date().toISOString().split('T')[0];
    const attendanceType = (type as AttendanceType) || AttendanceType.CLASS;
    return this.attendanceService.getDailySummary(tenantId, recordedDate, attendanceType);
  }

  @Get()
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.VIEW })
  async listAttendance(
    @Req() req: any,
    @Query() filter: AttendanceFilterDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.attendanceService.listAttendance(tenantId, filter);
  }
}
