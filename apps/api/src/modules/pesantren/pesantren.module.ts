import { Module } from '@nestjs/common';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PesantrenController } from './pesantren.controller';
import { DormitoryService } from './dormitory.service';
import { TahfizService } from './tahfiz.service';
import { PesantrenPermitService } from './pesantren-permit.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [PesantrenController],
  providers: [DormitoryService, TahfizService, PesantrenPermitService],
  exports: [DormitoryService, TahfizService, PesantrenPermitService],
})
export class PesantrenModule {}
