import { IsNumber, IsString } from 'class-validator';

export class UpdateTrackingDto {
  @IsNumber()
  latitude: number;

  @IsNumber()
  longitude: number;

  @IsString()
  status: string;
}