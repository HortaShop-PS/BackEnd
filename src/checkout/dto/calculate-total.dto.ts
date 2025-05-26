import { IsNumber, IsString, IsEnum, IsOptional } from 'class-validator';
import { DeliveryMethod } from '../entities/checkout.entity';

export class CalculateTotalDto {
  @IsString()
  orderId: string;

  @IsNumber()
  addressId: number;

  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;

  @IsOptional()
  @IsString()
  couponCode?: string;
}