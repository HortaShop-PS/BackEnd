import { IsString } from 'class-validator';

export class ValidateAddressDto {
  @IsString()
  address: string;
}

export class ValidateAddressResponseDto {
  isValid: boolean;
  formattedAddress?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  suggestions?: string[];
}