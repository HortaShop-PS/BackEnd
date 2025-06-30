import { Controller, Get, Post, Body, Param, Query, UseGuards, Request, Delete } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto, RegisterDeviceTokenDto, SendPushNotificationDto, NotificationType } from '../dto/notification.dto'; // ✅ Adicionar NotificationType aqui
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-token')
  async registerDeviceToken(@Request() req, @Body() registerDeviceTokenDto: RegisterDeviceTokenDto) {
    return await this.notificationsService.registerDeviceToken(req.user.id, registerDeviceTokenDto);
  }

  @Get()
  async getUserNotifications(
    @Request() req,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20
  ) {
    return await this.notificationsService.getUserNotifications(req.user.id, page, limit);
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    const count = await this.notificationsService.getUnreadCount(req.user.id);
    return { count };
  }

  @Post(':id/mark-read')
  async markAsRead(@Request() req, @Param('id') id: number) {
    await this.notificationsService.markAsRead(id, req.user.id);
    return { success: true };
  }

  @Post('mark-all-read')
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.id);
    return { success: true };
  }

  // NOVO: Deletar notificação específica
  @Delete(':id')
  async deleteNotification(@Request() req, @Param('id') id: number) {
    await this.notificationsService.deleteNotification(id, req.user.id);
    return { success: true };
  }

  // NOVO: Limpar todas as notificações do usuário
  @Delete('clear-all')
  async clearAllNotifications(@Request() req) {
    await this.notificationsService.clearAllNotifications(req.user.id);
    return { success: true };
  }

  // Endpoint para administradores enviarem notificações
  @Post('send')
  async sendNotification(@Body() sendPushNotificationDto: SendPushNotificationDto) {
    try {
      // Se tem userId, criar notificação no banco E enviar push
      if (sendPushNotificationDto.userId) {
        // 1. Criar notificação no banco primeiro
        const notificationData = {
          title: sendPushNotificationDto.title,
          body: sendPushNotificationDto.body,
          type: 'system' as any, // ou o tipo que você quiser
          data: sendPushNotificationDto.data,
          userId: sendPushNotificationDto.userId
        };
        
        const savedNotification = await this.notificationsService.createNotification(notificationData);
        
        // 2. Enviar push notification
        await this.notificationsService.sendPushToUser(sendPushNotificationDto.userId, sendPushNotificationDto);
        
        return { success: true, notificationId: savedNotification.id };
      } 
      // Se tem topic, só enviar push (não salva no banco)
      else if (sendPushNotificationDto.topic) {
        await this.notificationsService.sendPushToTopic(sendPushNotificationDto.topic, sendPushNotificationDto);
        return { success: true };
      }
      
      return { success: false, message: 'userId ou topic é obrigatório' };
    } catch (error) {
      console.error('Erro ao enviar notificação:', error);
      return { success: false, error: error.message };
    }
  }

  @Post('create')
  async createNotification(@Body() createNotificationDto: CreateNotificationDto) {
    return await this.notificationsService.createNotification(createNotificationDto);
  }

  @Post('deactivate-token')
  async deactivateDeviceToken(@Request() req, @Body() body: { token: string }) {
    await this.notificationsService.deactivateDeviceToken(req.user.id, body.token);
    return { success: true };
  }

  @Delete('order/:orderId/type/:type')
  async deleteNotificationsByOrderAndType(
    @Param('orderId') orderId: string,
    @Param('type') type: string,
    @Request() req
  ) {
    try {
      // Validar se o tipo é válido
      if (!Object.values(NotificationType).includes(type as NotificationType)) {
        return { success: false, message: 'Tipo de notificação inválido' };
      }

      await this.notificationsService.deleteNotificationsByOrderAndType(
        orderId, 
        type as NotificationType
      );
      
      return { success: true, message: 'Notificações excluídas com sucesso' };
    } catch (error) {
      console.error('Erro ao excluir notificações:', error);
      return { success: false, error: error.message };
    }
  }

  @Delete('order/:orderId')
  async deleteNotificationsByOrder(
    @Param('orderId') orderId: string,
    @Request() req
  ) {
    try {
      await this.notificationsService.deleteNotificationsByOrder(orderId);
      return { success: true, message: 'Todas as notificações do pedido foram excluídas' };
    } catch (error) {
      console.error('Erro ao excluir notificações do pedido:', error);
      return { success: false, error: error.message };
    }
  }
}