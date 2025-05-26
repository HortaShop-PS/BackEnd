import { IsNumber, IsString, IsEnum } from 'class-validator';
import { DeliveryMethod } from '../entities/checkout.entity';

export class UpdateAddressDeliveryDto {
  @IsString()
  orderId: string;

  @IsNumber()
  addressId: number;

  @IsEnum(DeliveryMethod)
  deliveryMethod: DeliveryMethod;
}