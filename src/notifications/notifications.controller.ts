import { Controller, Post, Body, UseGuards, Param, ParseIntPipe } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { SendNotificationDto, SendNotificationToUserDto } from './dto/send-notification.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; // Assuming admin access

@Controller('notifications')
@UseGuards(JwtAuthGuard) // Protect all notification endpoints
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('send-to-user')
  async sendToUser(@Body() sendNotificationToUserDto: SendNotificationToUserDto) {
    const { userId, title, body, data } = sendNotificationToUserDto;
    return this.notificationsService.sendTestNotificationToUser(userId, title, body, data);
  }

  @Post('send-to-all')
  async sendToAll(@Body() sendNotificationDto: SendNotificationDto) {
    const { title, body, data } = sendNotificationDto;
    return this.notificationsService.sendTestNotificationToAllUsers(title, body, data);
  }
}
