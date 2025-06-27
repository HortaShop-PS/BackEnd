import { IsEnum, IsOptional, IsString } from 'class-validator';

export enum OrderStatusDto {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SHIPPED = 'shipped',
  DELIVERED = 'delivered',
  CANCELED = 'canceled'
}

export class UpdateOrderStatusDto {
  @IsEnum(OrderStatusDto)
  status: OrderStatusDto;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class NotifyReadyDto {
  @IsOptional()
  @IsString()
  message?: string; // ← CORRIGIDO: alterado de 'notes' para 'message'
}