import { IsString, IsNotEmpty, IsOptional, IsNumber } from 'class-validator';

export class SendNotificationDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsOptional()
  data?: { [key: string]: string };
}

export class SendNotificationToUserDto extends SendNotificationDto {
  @IsNotEmpty()
  @IsNumber()
  userId: number;
}
