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
import { LeaveRequestsService } from './leave-requests.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction, LeaveStatus } from '@edusaas/shared-types';
import {
  CreateLeaveRequestDto,
  ApproveLeaveRequestDto,
} from '@edusaas/api-contracts';

@Controller('leave-requests')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class LeaveRequestsController {
  constructor(private readonly leaveRequestsService: LeaveRequestsService) {}

  @Post()
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.CREATE })
  async createLeaveRequest(
    @Req() req: any,
    @Body() dto: CreateLeaveRequestDto,
  ) {
    const tenantId = req.user.tenantId;
    return this.leaveRequestsService.createLeaveRequest(tenantId, dto);
  }

  @Patch(':id/approval')
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.APPROVE })
  async approveLeaveRequest(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApproveLeaveRequestDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.leaveRequestsService.approveLeaveRequest(tenantId, userId, null, id, dto);
  }

  @Get()
  @RequirePermissions({ module: PermissionModule.ATTENDANCE, action: PermissionAction.VIEW })
  async listLeaveRequests(
    @Req() req: any,
    @Query('studentId') studentId?: string,
    @Query('status') status?: LeaveStatus,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user.tenantId;
    return this.leaveRequestsService.listLeaveRequests(tenantId, {
      studentId,
      status,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }
}
