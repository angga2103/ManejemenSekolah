import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { StudentsService } from './students.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RequirePermissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { PermissionModule, PermissionAction } from '@edusaas/shared-types';
import {
  CreateStudentDto,
  UpdateStudentDto,
  StudentFilterQueryDto,
  StudentBatchImportItem,
} from '@edusaas/api-contracts';

@ApiTags('Master Data: Students (Santri/Siswa)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('api/v1/master-data/students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  @RequirePermissions({ module: PermissionModule.STUDENTS, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'List students with filters and pagination' })
  async listStudents(
    @CurrentUser() user: any,
    @Query() query: StudentFilterQueryDto,
  ) {
    return this.studentsService.listStudents(user.tenantId, query);
  }

  @Get('export/csv')
  @RequirePermissions({ module: PermissionModule.STUDENTS, action: PermissionAction.EXPORT })
  @ApiOperation({ summary: 'Export students to CSV' })
  async exportCsv(
    @CurrentUser() user: any,
    @Query('classGroupId') classGroupId: string,
    @Res() res: Response,
  ) {
    const csvData = await this.studentsService.exportCsv(user.tenantId, classGroupId);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="data-santri.csv"');
    res.send(csvData);
  }

  @Get(':id')
  @RequirePermissions({ module: PermissionModule.STUDENTS, action: PermissionAction.VIEW })
  @ApiOperation({ summary: 'Get single student details with class and guardians' })
  async getStudentById(@CurrentUser() user: any, @Param('id') id: string) {
    return this.studentsService.getStudentById(user.tenantId, id);
  }

  @Post()
  @RequirePermissions({ module: PermissionModule.STUDENTS, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Register a new student' })
  async createStudent(
    @CurrentUser() user: any,
    @Body() dto: CreateStudentDto,
  ) {
    return this.studentsService.createStudent(user.tenantId, dto, user.id);
  }

  @Put(':id')
  @RequirePermissions({ module: PermissionModule.STUDENTS, action: PermissionAction.UPDATE })
  @ApiOperation({ summary: 'Update student master record' })
  async updateStudent(
    @CurrentUser() user: any,
    @Param('id') id: string,
    @Body() dto: UpdateStudentDto,
  ) {
    return this.studentsService.updateStudent(user.tenantId, id, dto, user.id);
  }

  @Delete(':id')
  @RequirePermissions({ module: PermissionModule.STUDENTS, action: PermissionAction.DELETE })
  @ApiOperation({ summary: 'Soft delete a student' })
  async deleteStudent(@CurrentUser() user: any, @Param('id') id: string) {
    return this.studentsService.deleteStudent(user.tenantId, id, user.id);
  }

  @Post('batch-import')
  @RequirePermissions({ module: PermissionModule.STUDENTS, action: PermissionAction.CREATE })
  @ApiOperation({ summary: 'Batch import students from Excel / JSON format' })
  async batchImport(
    @CurrentUser() user: any,
    @Body() body: { items: StudentBatchImportItem[] },
  ) {
    return this.studentsService.batchImport(user.tenantId, body.items, user.id);
  }
}
