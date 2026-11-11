import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EmployeesService } from './employees.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import { CreateEmployeeDto } from '@edusaas/api-contracts';

@ApiTags('Master Data: Employees (Dewan Guru, Musyrif, Staff)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/master-data/employees')
export class EmployeesController {
  constructor(private readonly employeesService: EmployeesService) {}

  @Get()
  @RequirePermissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'List employees and teachers' })
  async listEmployees(@CurrentUser() user: any) {
    return this.employeesService.listEmployees(user.tenantId);
  }

  @Post()
  @RequirePermissions({ module: PermissionModule.EMPLOYEES, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Create employee and provision user login account' })
  async createEmployee(
    @CurrentUser() user: any,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeesService.createEmployee(user.tenantId, dto, user.id);
  }
}
