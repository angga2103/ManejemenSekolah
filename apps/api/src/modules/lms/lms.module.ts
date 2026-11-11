import { Module } from '@nestjs/common';
import { LmsService } from './lms.service';
import { LmsController } from './lms.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, AuditModule, RbacModule],
  controllers: [LmsController],
  providers: [LmsService],
  exports: [LmsService],
})
export class LmsModule {}
