import { IsString, IsNotEmpty, Length, Matches, IsNumber, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class CardDetailsDto {
  @IsString()
  @IsNotEmpty()
  @Length(13, 19)
  @Matches(/^[0-9]+$/, { message: 'Número do cartão deve conter apenas dígitos' })
  number: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Data de validade deve estar no formato MM/AA',
  })
  expiry: string; // MM/AA

  @IsString()
  @IsNotEmpty()
  @Length(3, 4)
  @Matches(/^[0-9]+$/, { message: 'CVV deve conter apenas dígitos' })
  cvv: string;
}

export class ProcessCardPaymentDto {
  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01) // Assumindo que o valor deve ser positivo
  amount: number;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CardDetailsDto)
  cardDetails: CardDetailsDto;
}
