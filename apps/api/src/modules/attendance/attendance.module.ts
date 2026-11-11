import { Module } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { AttendanceController } from './attendance.controller';
import { LeaveRequestsService } from './leave-requests.service';
import { LeaveRequestsController } from './leave-requests.controller';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RbacModule } from '../rbac/rbac.module';

@Module({
  imports: [PrismaModule, AuditModule, NotificationsModule, RbacModule],
  controllers: [AttendanceController, LeaveRequestsController],
  providers: [AttendanceService, LeaveRequestsService],
  exports: [AttendanceService, LeaveRequestsService],
})
export class AttendanceModule {}
