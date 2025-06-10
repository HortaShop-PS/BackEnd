import { IsNotEmpty, IsObject, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AddressDto {
  @IsString()
  @IsNotEmpty()
  street: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  state: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  country: string;
}

export class BankDetailsDto {
  @IsString()
  @IsNotEmpty()
  bankName: string;

  @IsString()
  @IsNotEmpty()
  agency: string;

  @IsString()
  @IsNotEmpty()
  accountNumber: string;
}

export class CompleteProfileDto {
  @IsString()
  @IsNotEmpty()
  cnpj: string;

  @IsObject()
  @ValidateNested()
  @Type(() => AddressDto)
  @IsNotEmpty()
  address: AddressDto;

  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  @IsNotEmpty()
  bankDetails: BankDetailsDto;

  @IsString()
  @IsNotEmpty()
  businessDescription: string;
}