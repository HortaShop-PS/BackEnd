import { IsNumber, IsPositive } from 'class-validator';

export class InitiateCheckoutDto {
  @IsNumber()
  @IsPositive()
  cartId: number;
}