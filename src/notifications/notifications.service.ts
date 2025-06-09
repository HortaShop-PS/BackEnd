import { Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase/firebase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly firebaseService: FirebaseService,
    private readonly usersService: UsersService,
  ) {}

  async sendTestNotificationToUser(userId: number, title: string, body: string, data?: { [key: string]: string }) {
    const user = await this.usersService.findOne(userId);
    if (user && user.fcmToken) {
      await this.firebaseService.sendPushNotification(user.fcmToken, title, body, data);
      return { success: true, message: `Notification sent to user ${userId}` };
    } else {
      return { success: false, message: `User ${userId} not found or has no FCM token.` };
    }
  }

  async sendTestNotificationToAllUsers(title: string, body: string, data?: { [key: string]: string }) {
    const users = await this.usersService.findAll();
    const results: { userId: number; success: boolean; message?: string; error?: string }[] = [];
    for (const user of users) {
      if (user.fcmToken) {
        try {
          await this.firebaseService.sendPushNotification(user.fcmToken, title, body, data);
          results.push({ userId: user.id, success: true });
        } catch (error) {
          console.error(`Failed to send notification to user ${user.id}:`, error);
          results.push({ userId: user.id, success: false, error: error.message });
        }
      } else {
        results.push({ userId: user.id, success: false, message: 'No FCM token' });
      }
    }
    return { success: true, message: 'Attempted to send notifications to all users.', results };
  }
}
