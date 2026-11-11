import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import {
  CreatePaymentDto,
  PaymentGatewaySimulationDto,
  PaymentGatewayWebhookDto,
} from '@edusaas/api-contracts';

@Controller('payments')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Post()
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.CREATE })
  async processPayment(@Req() req: any, @Body() dto: CreatePaymentDto) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.service.processPayment(tenantId, userId, dto);
  }

  @Post('simulate-gateway')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.CREATE })
  async simulateGatewayCharge(@Req() req: any, @Body() dto: PaymentGatewaySimulationDto) {
    const tenantId = req.user.tenantId;
    return this.service.simulateGatewayCharge(tenantId, dto);
  }

  @Post('webhook')
  @Public()
  async processGatewayWebhook(@Req() req: any, @Body() dto: PaymentGatewayWebhookDto) {
    const tenantId = req.headers['x-tenant-id'] || req.user?.tenantId;
    return this.service.processGatewayWebhook(tenantId, dto);
  }

  @Get(':id/receipt')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.VIEW })
  async getReceipt(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.service.getDigitalReceipt(tenantId, id);
  }
}
