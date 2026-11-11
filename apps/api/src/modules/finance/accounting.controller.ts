import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import { CreateCashAccountDto, CreateJournalEntryDto } from '@edusaas/api-contracts';

@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AccountingController {
  constructor(private readonly service: AccountingService) {}

  @Post('cash-accounts')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.CREATE })
  async createCashAccount(@Req() req: any, @Body() dto: CreateCashAccountDto) {
    const tenantId = req.user.tenantId;
    return this.service.createCashAccount(tenantId, dto);
  }

  @Get('cash-accounts')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.VIEW })
  async listCashAccounts(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.service.listCashAccounts(tenantId);
  }

  @Post('journal-entries')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.CREATE })
  async createJournalEntry(@Req() req: any, @Body() dto: CreateJournalEntryDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.createJournalEntry(tenantId, userId, dto);
  }

  @Get('journal-entries')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.VIEW })
  async listJournalEntries(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.service.listJournalEntries(tenantId);
  }

  @Get('summary')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.VIEW })
  async getFinanceSummary(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.service.getFinanceSummary(tenantId);
  }
}
