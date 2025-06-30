import { IsString, IsOptional, IsBoolean, IsObject, IsEnum, IsNumber } from 'class-validator';

export enum NotificationType {
  ORDER = 'order',
  ORDER_SHIPPED = 'order_shipped',
  ORDER_DELIVERED = 'order_delivered',
  PRODUCT = 'product',
  PROMOTION = 'promotion',
  SYSTEM = 'system'
}

export class CreateNotificationDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsEnum(NotificationType)
  type: NotificationType;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsNumber()
  userId: number;
}

export class RegisterDeviceTokenDto {
  @IsString()
  token: string;

  @IsString()
  platform: string;
}

export class SendPushNotificationDto {
  @IsString()
  title: string;

  @IsString()
  body: string;

  @IsOptional()
  @IsObject()
  data?: any;

  @IsOptional()
  @IsNumber()
  userId?: number;

  @IsOptional()
  @IsString()
  topic?: string;
}