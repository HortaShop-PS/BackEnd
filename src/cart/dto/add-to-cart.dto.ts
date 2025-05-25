import { IsNumber, IsUUID, IsOptional, Min } from 'class-validator';

export class AddToCartDto {
  @IsNumber()
  @Min(1)
  @IsOptional()
  quantity: number = 1;
}
