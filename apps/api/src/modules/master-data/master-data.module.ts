import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

// Services
import { StudentsService } from './students.service';
import { GuardiansService } from './guardians.service';
import { ClassesService } from './classes.service';
import { InstitutionsService } from './institutions.service';
import { EmployeesService } from './employees.service';
import { SubjectsService } from './subjects.service';

// Controllers
import { StudentsController } from './students.controller';
import { GuardiansController } from './guardians.controller';
import { ClassesController } from './classes.controller';
import { InstitutionsController } from './institutions.controller';
import { EmployeesController } from './employees.controller';
import { SubjectsController } from './subjects.controller';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [
    StudentsController,
    GuardiansController,
    ClassesController,
    InstitutionsController,
    EmployeesController,
    SubjectsController,
  ],
  providers: [
    StudentsService,
    GuardiansService,
    ClassesService,
    InstitutionsService,
    EmployeesService,
    SubjectsService,
  ],
  exports: [
    StudentsService,
    GuardiansService,
    ClassesService,
    InstitutionsService,
    EmployeesService,
    SubjectsService,
  ],
})
export class MasterDataModule {}
