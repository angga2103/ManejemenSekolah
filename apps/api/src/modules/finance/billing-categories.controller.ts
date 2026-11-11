import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { BillingCategoriesService } from './billing-categories.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import { CreateBillingCategoryDto } from '@edusaas/api-contracts';

@Controller('billing-categories')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class BillingCategoriesController {
  constructor(private readonly service: BillingCategoriesService) {}

  @Post()
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.CREATE })
  async create(@Req() req: any, @Body() dto: CreateBillingCategoryDto) {
    const tenantId = req.user.tenantId;
    return this.service.create(tenantId, dto);
  }

  @Get()
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.VIEW })
  async findAll(@Req() req: any) {
    const tenantId = req.user.tenantId;
    return this.service.findAll(tenantId);
  }

  @Get(':id')
  @RequirePermissions({ module: PermissionModule.FINANCE, action: PermissionAction.VIEW })
  async findById(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    return this.service.findById(tenantId, id);
  }
}
