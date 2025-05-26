import { IsString, IsOptional, Length, Matches, IsBoolean } from 'class-validator';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  @Length(13, 19)
  @Matches(/^[0-9]+$/, { message: 'Card number must contain only digits' })
  number?: string;

  @IsOptional()
  @IsString()
  cardholderName?: string; // Alterado de 'name' para 'cardholderName'

  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Expiry date must be in MM/YY format',
  })
  expiry?: string; // MM/YY

  // CVV removido - não deve ser atualizado ou armazenado

  @IsOptional()
  @IsString()
  brand?: string;

  @IsOptional()
  @IsBoolean()
  isPrincipal?: boolean;

  @IsString()
  @IsOptional()
  @Length(1, 50)
  nickname?: string;

  @IsString()
  @IsOptional()
  // TODO: Considerar usar um enum aqui também: 'credit', 'debit'
  paymentMethodType?: string; // 'credit' or 'debit'
}
