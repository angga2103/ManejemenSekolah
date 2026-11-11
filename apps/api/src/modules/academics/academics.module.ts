import { Module } from '@nestjs/common';
import { GradesService } from './grades.service';
import { ReportCardsService } from './report-cards.service';
import { GradesController } from './grades.controller';
import { ReportCardsController } from './report-cards.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, AuditModule, RbacModule],
  controllers: [GradesController, ReportCardsController],
  providers: [GradesService, ReportCardsService],
  exports: [GradesService, ReportCardsService],
})
export class AcademicsModule {}
