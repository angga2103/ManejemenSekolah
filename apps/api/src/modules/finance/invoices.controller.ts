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
import { InvoicesService } from './invoices.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import {
  CreateInvoiceDto,
  GenerateBatchInvoicesDto,
  InvoiceFilterDto,
} from '@edusaas/api-contracts';

@Controller('invoices')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class InvoicesController {
  constructor(private readonly service: InvoicesService) {}

  @Post()
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.CREATE })
  async createInvoice(@Req() req: any, @Body() dto: CreateInvoiceDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.createInvoice(tenantId, userId, dto);
  }

  @Post('batch-generate')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.CREATE })
  async generateBatchInvoices(@Req() req: any, @Body() dto: GenerateBatchInvoicesDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.generateBatchInvoices(tenantId, userId, dto);
  }

  @Get()
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.VIEW })
  async findAll(@Req() req: any, @Query() filter: InvoiceFilterDto) {
    const tenantId = req.user.tenantId;
    // Check if user is parent (guardian)
    const isParent = req.user.roles?.includes('parent');
    const guardianUserId = isParent ? req.user.userId : undefined;
    return this.service.findAll(tenantId, filter, guardianUserId);
  }

  @Get(':id')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.VIEW })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.service.findById(tenantId, id);
  }
}
