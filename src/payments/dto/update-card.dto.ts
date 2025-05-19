import { IsString, IsOptional, Length, Matches } from 'class-validator';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  @Length(13, 19)
  @Matches(/^[0-9]+$/, { message: 'Card number must contain only digits' })
  number?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Expiry date must be in MM/YY format',
  })
  expiry?: string; // MM/YY

  @IsOptional()
  @IsString()
  @Length(3, 4)
  @Matches(/^[0-9]+$/, { message: 'CVV must contain only digits' })
  cvv?: string;

  @IsOptional()
  @IsString()
  // TODO: Consider using an enum for cardType ('debit', 'credit') for better type safety
  cardType?: string;
}