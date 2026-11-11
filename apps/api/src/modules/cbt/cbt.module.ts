import { Module } from '@nestjs/common';
import { CbtService } from './cbt.service';
import { CbtController } from './cbt.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { RbacModule } from '../rbac/rbac.module';
import { AcademicsModule } from '../academics/academics.module';

@Module({
  imports: [PrismaModule, AuditModule, RbacModule, AcademicsModule],
  controllers: [CbtController],
  providers: [CbtService],
  exports: [CbtService],
})
export class CbtModule {}
