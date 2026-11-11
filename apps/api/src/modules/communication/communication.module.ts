import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CommunicationController } from './communication.controller';
import { DisciplineService } from './discipline.service';
import { CounselingService } from './counseling.service';
import { ComplaintService } from './complaint.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [CommunicationController],
  providers: [DisciplineService, CounselingService, ComplaintService],
  exports: [DisciplineService, CounselingService, ComplaintService],
})
export class CommunicationModule {}
