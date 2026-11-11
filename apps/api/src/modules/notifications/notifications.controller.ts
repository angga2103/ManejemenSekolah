import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SendNotificationDto, RegisterDeviceTokenDto } from '@edusaas/api-contracts';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.notificationsService.getUserNotifications(
      tenantId,
      userId,
      Number(page) || 1,
      Number(limit) || 20,
    );
  }

  @Patch(':id/read')
  async markAsRead(@Req() req: any, @Param('id') id: string) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.notificationsService.markAsRead(tenantId, userId, id);
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req: any) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.notificationsService.markAllAsRead(tenantId, userId);
  }

  @Post('device-token')
  async registerDeviceToken(
    @Req() req: any,
    @Body() dto: RegisterDeviceTokenDto,
  ) {
    const tenantId = req.user.tenantId;
    const userId = req.user.userId;
    return this.notificationsService.registerDeviceToken(tenantId, userId, dto);
  }

  @Post('send')
  async sendDirect(@Req() req: any, @Body() dto: SendNotificationDto) {
    const tenantId = req.user.tenantId;
    return this.notificationsService.sendNotification(tenantId, dto);
  }
}
