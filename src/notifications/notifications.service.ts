import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as admin from 'firebase-admin';
import { Notification } from '../entities/notification.entity';
import { DeviceToken } from '../entities/device-token.entity';
import { User } from '../entities/user.entity';
import { CreateNotificationDto, RegisterDeviceTokenDto, SendPushNotificationDto } from '../dto/notification.dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(DeviceToken)
    private deviceTokenRepository: Repository<DeviceToken>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      // CORRIGIDO: Usar getApp() se já inicializado
      if (admin.apps.length > 0) {
        this.firebaseApp = admin.app();
        this.logger.log('Firebase Admin SDK já inicializado, usando app existente');
      } else {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
          }),
        });
        this.logger.log('Firebase Admin SDK inicializado com sucesso');
      }
    } catch (error) {
      this.logger.error('Erro ao inicializar Firebase Admin SDK:', error);
    }
  }

  async createNotification(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    try {
      const notification = this.notificationRepository.create(createNotificationDto);
      const savedNotification = await this.notificationRepository.save(notification);
      this.logger.log(`Notificação criada no banco para usuário ${savedNotification.userId}`);
      return savedNotification;
    } catch (error) {
      this.logger.error('Erro ao criar notificação:', error);
      throw error;
    }
  }

  async registerDeviceToken(userId: number, registerDeviceTokenDto: RegisterDeviceTokenDto): Promise<void> {
    try {
      console.log(`📱 Registrando token FCM para usuário ${userId}`);
      console.log(`📱 Token: ${registerDeviceTokenDto.token.substring(0, 50)}...`);
      console.log(`📱 Platform: ${registerDeviceTokenDto.platform}`);

      // Verificar se o token já existe
      const existingToken = await this.deviceTokenRepository.findOne({
        where: { token: registerDeviceTokenDto.token }
      });

      if (existingToken) {
        console.log(`♻️ Token já existe, atualizando usuário de ${existingToken.userId} para ${userId}`);
        
        // Atualizar o token existente
        existingToken.userId = userId;
        existingToken.platform = registerDeviceTokenDto.platform;
        existingToken.active = true;
        existingToken.updatedAt = new Date();
        
        await this.deviceTokenRepository.save(existingToken);
      } else {
        console.log(`✨ Criando novo token para usuário ${userId}`);
        
        // Criar novo token
        const newToken = this.deviceTokenRepository.create({
          userId,
          token: registerDeviceTokenDto.token,
          platform: registerDeviceTokenDto.platform,
          active: true,
        });
        
        await this.deviceTokenRepository.save(newToken);
      }

      console.log(`✅ Token FCM registrado com sucesso para usuário ${userId}`);
    } catch (error) {
      console.error(`❌ Erro ao registrar token FCM para usuário ${userId}:`, error);
      throw error;
    }
  }

  async sendPushToUser(userId: number, notification: SendPushNotificationDto): Promise<void> {
    try {
      console.log(`📤 Enviando push para usuário ${userId}`);
      
      const deviceTokens = await this.deviceTokenRepository.find({
        where: { userId, active: true }
      });

      if (deviceTokens.length === 0) {
        console.log(`❌ Nenhum token ativo encontrado para usuário ${userId}`);
        return;
      }

      console.log(`📱 Encontrados ${deviceTokens.length} tokens ativos para usuário ${userId}`);
      const tokens = deviceTokens.map(dt => dt.token);

      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data ? this.convertDataToStrings(notification.data) : {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#7ABC00',
            sound: 'default',
            priority: 'high' as const,
            channelId: 'default'
          }
        },
        apns: {
          payload: {
            aps: {
              badge: 1,
              sound: 'default'
            }
          }
        },
        tokens,
      };

      console.log(`🚀 Enviando notificação para ${tokens.length} devices...`);
      
      // CORRIGIDO: Usar this.firebaseApp.messaging()
      const response = await this.firebaseApp.messaging().sendEachForMulticast(message);
      
      console.log(`📊 Resultado: ${response.successCount}/${tokens.length} sucessos, ${response.failureCount} falhas`);

      // Processar tokens inválidos para limpeza automática
      if (response.failureCount > 0) {
        const invalidTokens: string[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            const errorCode = resp.error?.code;
            console.error(`❌ Erro no token ${idx}: ${errorCode} - ${resp.error?.message}`);
            
            if (
              errorCode === 'messaging/invalid-registration-token' ||
              errorCode === 'messaging/registration-token-not-registered' ||
              errorCode === 'messaging/invalid-argument'
            ) {
              invalidTokens.push(tokens[idx]);
            }
          }
        });

        if (invalidTokens.length > 0) {
          console.log(`🧹 Removendo ${invalidTokens.length} tokens inválidos automaticamente`);
          await this.deviceTokenRepository.update(
            { token: In(invalidTokens) },
            { active: false }
          );
        }
      }

    } catch (error) {
      console.error(`💥 Erro ao enviar push para usuário ${userId}:`, error);
      throw error;
    }
  }

  async sendPushToTopic(topic: string, notification: SendPushNotificationDto): Promise<void> {
    try {
      const message = {
        notification: {
          title: notification.title,
          body: notification.body,
        },
        data: notification.data ? this.convertDataToStrings(notification.data) : {},
        android: {
          notification: {
            icon: 'ic_notification',
            color: '#7ABC00',
            sound: 'default',
            priority: 'high' as const,
            channelId: 'default'
          }
        },
        topic,
      };

      // CORRIGIDO: Usar this.firebaseApp.messaging()
      const response = await this.firebaseApp.messaging().send(message);
      this.logger.log(`Push enviado para tópico ${topic}: ${response}`);

    } catch (error) {
      this.logger.error(`Erro ao enviar push para tópico ${topic}:`, error);
      throw error;
    }
  }

  async getUserNotifications(userId: number, page: number = 1, limit: number = 20): Promise<any> {
    try {
      const [notifications, total] = await this.notificationRepository.findAndCount({
        where: { userId },
        order: { createdAt: 'DESC' },
        skip: (page - 1) * limit,
        take: limit,
      });

      return {
        notifications,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(`Erro ao buscar notificações para usuário ${userId}:`, error);
      throw error;
    }
  }

  async markAsRead(notificationId: number, userId: number): Promise<void> {
    try {
      await this.notificationRepository.update(
        { id: notificationId, userId },
        { read: true }
      );
      this.logger.log(`Notificação ${notificationId} marcada como lida para usuário ${userId}`);
    } catch (error) {
      this.logger.error(`Erro ao marcar notificação como lida:`, error);
      throw error;
    }
  }

  async markAllAsRead(userId: number): Promise<void> {
    try {
      await this.notificationRepository.update(
        { userId, read: false },
        { read: true }
      );
      this.logger.log(`Todas as notificações marcadas como lidas para usuário ${userId}`);
    } catch (error) {
      this.logger.error(`Erro ao marcar todas as notificações como lidas:`, error);
      throw error;
    }
  }

  // CORRIGIDO: Deletar notificação específica - verificação segura de result.affected
  async deleteNotification(notificationId: number, userId: number): Promise<void> {
    try {
      const result = await this.notificationRepository.delete({
        id: notificationId,
        userId
      });
      
      // CORRIGIDO: Verificação segura para evitar erro TS18049
      if (result.affected && result.affected > 0) {
        this.logger.log(`Notificação ${notificationId} deletada para usuário ${userId}`);
      } else {
        this.logger.warn(`Notificação ${notificationId} não encontrada para usuário ${userId}`);
      }
    } catch (error) {
      this.logger.error(`Erro ao deletar notificação ${notificationId}:`, error);
      throw error;
    }
  }

  // CORRIGIDO: Limpar todas as notificações do usuário - verificação segura de result.affected
  async clearAllNotifications(userId: number): Promise<void> {
    try {
      const result = await this.notificationRepository.delete({ userId });
      
      // CORRIGIDO: Verificação segura para evitar erro TS18049
      const affectedCount = result.affected || 0;
      this.logger.log(`${affectedCount} notificações deletadas para usuário ${userId}`);
    } catch (error) {
      this.logger.error(`Erro ao limpar todas as notificações para usuário ${userId}:`, error);
      throw error;
    }
  }

  async getUnreadCount(userId: number): Promise<number> {
    try {
      return await this.notificationRepository.count({
        where: { userId, read: false }
      });
    } catch (error) {
      this.logger.error(`Erro ao contar notificações não lidas para usuário ${userId}:`, error);
      return 0;
    }
  }

  private convertDataToStrings(data: any): { [key: string]: string } {
    const result: { [key: string]: string } = {};
    for (const [key, value] of Object.entries(data)) {
      result[key] = String(value);
    }
    return result;
  }

  // Método para testar conectividade com Firebase
  async testFirebaseConnection(): Promise<boolean> {
    try {
      // CORRIGIDO: Usar this.firebaseApp.messaging()
      await this.firebaseApp.messaging().send({
        token: 'test-token',
        notification: {
          title: 'Test',
          body: 'Test'
        }
      });
      return true;
    } catch (error) {
      if (error.code === 'messaging/invalid-registration-token') {
        this.logger.log('✅ Firebase connection test successful');
        return true;
      }
      this.logger.error('❌ Firebase connection test failed:', error);
      return false;
    }
  }

  // Método para enviar notificação a múltiplos usuários
  async sendPushToMultipleUsers(userIds: number[], notification: SendPushNotificationDto): Promise<void> {
    try {
      const promises = userIds.map(userId => this.sendPushToUser(userId, notification));
      await Promise.allSettled(promises);
      this.logger.log(`Push notifications enviadas para ${userIds.length} usuários`);
    } catch (error) {
      this.logger.error('Erro ao enviar push para múltiplos usuários:', error);
    }
  }

  // Método para enviar notificação broadcast (todos os usuários ativos)
  async sendBroadcastNotification(notification: SendPushNotificationDto): Promise<void> {
    try {
      const activeTokens = await this.deviceTokenRepository.find({
        where: { active: true },
        take: 500
      });

      if (activeTokens.length === 0) {
        this.logger.warn('❌ No active device tokens found for broadcast');
        return;
      }

      const tokens = activeTokens.map(dt => dt.token);
      const batches = this.chunkArray(tokens, 100);

      for (const tokenBatch of batches) {
        try {
          const message = {
            notification: {
              title: notification.title,
              body: notification.body,
            },
            data: notification.data ? this.convertDataToStrings(notification.data) : {},
            android: {
              notification: {
                icon: 'ic_notification',
                color: '#7ABC00',
                sound: 'default',
                priority: 'high' as const,
                channelId: 'default'
              }
            },
            tokens: tokenBatch,
          };

          // CORRIGIDO: Usar this.firebaseApp.messaging()
          const response = await this.firebaseApp.messaging().sendEachForMulticast(message);
          this.logger.log(`📡 Broadcast batch: ${response.successCount}/${tokenBatch.length} successful`);

          if (response.failureCount > 0) {
            const invalidTokens: string[] = [];
            response.responses.forEach((resp, idx) => {
              if (!resp.success) {
                const errorCode = resp.error?.code;
                if (
                  errorCode === 'messaging/invalid-registration-token' ||
                  errorCode === 'messaging/registration-token-not-registered'
                ) {
                  invalidTokens.push(tokenBatch[idx]);
                }
              }
            });

            if (invalidTokens.length > 0) {
              await this.deviceTokenRepository.update(
                { token: In(invalidTokens) },
                { active: false }
              );
            }
          }
        } catch (error) {
          this.logger.error('Error in broadcast batch:', error);
        }
      }
    } catch (error) {
      this.logger.error('Erro ao enviar broadcast notification:', error);
    }
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async deactivateDeviceToken(userId: number, token: string): Promise<void> {
    try {
      await this.deviceTokenRepository.update(
        { userId, token },
        { active: false }
      );
      this.logger.log(`🔇 Token desativado para usuário ${userId}`);
    } catch (error) {
      this.logger.error(`Erro ao desativar token para usuário ${userId}:`, error);
    }
  }

  // CORRIGIDO: Método para limpar tokens antigos/inativos - verificação segura de result.affected
  async cleanupInactiveTokens(): Promise<void> {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const result = await this.deviceTokenRepository
        .createQueryBuilder()
        .delete()
        .from(DeviceToken)
        .where('active = :active', { active: false })
        .andWhere('updatedAt < :date', { date: thirtyDaysAgo })
        .execute();

      // CORRIGIDO: Verificação segura para evitar erro TS18049
      const affectedCount = result.affected || 0;
      this.logger.log(`🧹 Cleanup: ${affectedCount} tokens antigos removidos`);
    } catch (error) {
      this.logger.error('Erro ao limpar tokens inativos:', error);
    }
  }

  // Método para obter estatísticas de tokens
  async getTokenStats(): Promise<any> {
    try {
      const [totalTokens, activeTokens, androidTokens, iosTokens] = await Promise.all([
        this.deviceTokenRepository.count(),
        this.deviceTokenRepository.count({ where: { active: true } }),
        this.deviceTokenRepository.count({ where: { platform: 'android', active: true } }),
        this.deviceTokenRepository.count({ where: { platform: 'ios', active: true } })
      ]);

      return {
        total: totalTokens,
        active: activeTokens,
        inactive: totalTokens - activeTokens,
        android: androidTokens,
        ios: iosTokens
      };
    } catch (error) {
      this.logger.error('Erro ao obter estatísticas de tokens:', error);
      return null;
    }
  }
}