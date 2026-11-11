import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { DormitoryService } from './dormitory.service';
import { TahfizService } from './tahfiz.service';
import { PesantrenPermitService } from './pesantren-permit.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionAction, PermissionModule } from '@edusaas/shared-types';
import {
  CreateDormitoryDto,
  CreateDormRoomDto,
  AllocateStudentBedDto,
  CreateHalaqahGroupDto,
  AddHalaqahMemberDto,
  RecordTahfizEntryDto,
  CreatePesantrenPermitDto,
  ApprovePesantrenPermitDto,
  SecurityGateCheckDto,
} from '@edusaas/api-contracts';

@Controller('pesantren')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PesantrenController {
  constructor(
    private readonly dormitoryService: DormitoryService,
    private readonly tahfizService: TahfizService,
    private readonly permitService: PesantrenPermitService
  ) {}

  // ===========================================================================
  // DORMITORY & ROOMS
  // ===========================================================================

  @Post('dormitories')
  @RequirePermissions({ module: PermissionModule.DORMITORY, action: PermissionAction.CREATE })
  createDormitory(@Req() req: any, @Body() dto: CreateDormitoryDto) {
    return this.dormitoryService.createDormitory(req.user.tenantId, dto);
  }

  @Get('dormitories')
  @RequirePermissions({ module: PermissionModule.DORMITORY, action: PermissionAction.VIEW })
  listDormitories(@Req() req: any) {
    return this.dormitoryService.listDormitories(req.user.tenantId);
  }

  @Get('dormitories/stats')
  @RequirePermissions({ module: PermissionModule.DORMITORY, action: PermissionAction.VIEW })
  getDormitoryStats(@Req() req: any) {
    return this.dormitoryService.getDormitoryStats(req.user.tenantId);
  }

  @Post('rooms')
  @RequirePermissions({ module: PermissionModule.DORMITORY, action: PermissionAction.CREATE })
  createRoom(@Req() req: any, @Body() dto: CreateDormRoomDto) {
    return this.dormitoryService.createRoom(req.user.tenantId, dto);
  }

  @Get('rooms')
  @RequirePermissions({ module: PermissionModule.DORMITORY, action: PermissionAction.VIEW })
  listRooms(@Req() req: any, @Query('dormitoryId') dormitoryId?: string) {
    return this.dormitoryService.listRooms(req.user.tenantId, dormitoryId);
  }

  @Post('allocations')
  @RequirePermissions({ module: PermissionModule.DORMITORY, action: PermissionAction.UPDATE })
  allocateBed(@Req() req: any, @Body() dto: AllocateStudentBedDto) {
    return this.dormitoryService.allocateBed(req.user.tenantId, dto);
  }

  @Delete('allocations/:id')
  @RequirePermissions({ module: PermissionModule.DORMITORY, action: PermissionAction.UPDATE })
  deallocateBed(@Req() req: any, @Param('id') id: string) {
    return this.dormitoryService.deallocateBed(req.user.tenantId, id);
  }

  // ===========================================================================
  // TAHFIZ & HALAQAH
  // ===========================================================================

  @Post('tahfiz/halaqah')
  @RequirePermissions({ module: PermissionModule.TAHFIZ, action: PermissionAction.CREATE })
  createHalaqah(@Req() req: any, @Body() dto: CreateHalaqahGroupDto) {
    return this.tahfizService.createHalaqahGroup(req.user.tenantId, dto);
  }

  @Get('tahfiz/halaqah')
  @RequirePermissions({ module: PermissionModule.TAHFIZ, action: PermissionAction.VIEW })
  listHalaqah(@Req() req: any) {
    return this.tahfizService.listHalaqahGroups(req.user.tenantId);
  }

  @Post('tahfiz/halaqah/:id/members')
  @RequirePermissions({ module: PermissionModule.TAHFIZ, action: PermissionAction.UPDATE })
  addHalaqahMember(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddHalaqahMemberDto
  ) {
    return this.tahfizService.addHalaqahMember(req.user.tenantId, id, dto);
  }

  @Delete('tahfiz/halaqah/:id/members/:studentId')
  @RequirePermissions({ module: PermissionModule.TAHFIZ, action: PermissionAction.UPDATE })
  removeHalaqahMember(
    @Req() req: any,
    @Param('id') id: string,
    @Param('studentId') studentId: string
  ) {
    return this.tahfizService.removeHalaqahMember(req.user.tenantId, id, studentId);
  }

  @Post('tahfiz/records')
  @RequirePermissions({ module: PermissionModule.TAHFIZ, action: PermissionAction.CREATE })
  recordTahfiz(@Req() req: any, @Body() dto: RecordTahfizEntryDto) {
    return this.tahfizService.recordTahfizEntry(req.user.tenantId, dto);
  }

  @Get('tahfiz/records')
  @RequirePermissions({ module: PermissionModule.TAHFIZ, action: PermissionAction.VIEW })
  listTahfizRecords(
    @Req() req: any,
    @Query('studentId') studentId?: string,
    @Query('halaqahGroupId') halaqahGroupId?: string,
    @Query('recordType') recordType?: string,
    @Query('fromDate') fromDate?: string,
    @Query('toDate') toDate?: string
  ) {
    return this.tahfizService.listTahfizRecords(req.user.tenantId, {
      studentId,
      halaqahGroupId,
      recordType,
      fromDate,
      toDate,
    });
  }

  @Get('tahfiz/students/:studentId/progress')
  @RequirePermissions({ module: PermissionModule.TAHFIZ, action: PermissionAction.VIEW })
  getStudentTahfizProgress(
    @Req() req: any,
    @Param('studentId') studentId: string
  ) {
    return this.tahfizService.getStudentProgress(req.user.tenantId, studentId);
  }

  // ===========================================================================
  // PERIZINAN SANTRI (PESANTREN PERMITS)
  // ===========================================================================

  @Post('permits')
  @RequirePermissions({ module: PermissionModule.PESANTREN, action: PermissionAction.CREATE })
  createPermit(@Req() req: any, @Body() dto: CreatePesantrenPermitDto) {
    return this.permitService.createPermit(req.user.tenantId, dto);
  }

  @Get('permits')
  @RequirePermissions({ module: PermissionModule.PESANTREN, action: PermissionAction.VIEW })
  listPermits(
    @Req() req: any,
    @Query('studentId') studentId?: string,
    @Query('status') status?: any,
    @Query('permitType') permitType?: any
  ) {
    return this.permitService.listPermits(req.user.tenantId, {
      studentId,
      status,
      permitType,
    });
  }

  @Get('permits/by-token/:token')
  @RequirePermissions({ module: PermissionModule.PESANTREN, action: PermissionAction.VIEW })
  getPermitByToken(@Req() req: any, @Param('token') token: string) {
    return this.permitService.getPermitByToken(req.user.tenantId, token);
  }

  @Patch('permits/:id/approve')
  @RequirePermissions({ module: PermissionModule.PESANTREN, action: PermissionAction.APPROVE })
  approvePermit(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: ApprovePesantrenPermitDto
  ) {
    return this.permitService.approvePermit(req.user.tenantId, id, dto);
  }

  @Post('permits/gate-check')
  @RequirePermissions({ module: PermissionModule.PESANTREN, action: PermissionAction.UPDATE })
  securityGateCheck(@Req() req: any, @Body() dto: SecurityGateCheckDto) {
    return this.permitService.securityGateCheck(req.user.tenantId, dto);
  }
}
