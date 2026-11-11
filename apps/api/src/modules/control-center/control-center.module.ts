import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../../common/prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';
import { ControlCenterController } from './control-center.controller';
import { ControlCenterService } from './control-center.service';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [PrismaModule, AuditModule, ConfigModule],
  controllers: [ControlCenterController],
  providers: [ControlCenterService, SubscriptionsService],
  exports: [ControlCenterService, SubscriptionsService],
})
export class ControlCenterModule {}
