import { IsEmail, IsOptional, IsString, IsBoolean } from 'class-validator';

export class UpdateDeliveryProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsBoolean()
  isAvailable?: boolean;
}