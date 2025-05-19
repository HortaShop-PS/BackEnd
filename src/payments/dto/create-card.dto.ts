import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  @Length(13, 19)
  @Matches(/^[0-9]+$/, { message: 'Card number must contain only digits' })
  number: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'Expiry date must be in MM/YY format',
  })
  expiry: string; // MM/YY

  @IsString()
  @IsNotEmpty()
  @Length(3, 4)
  @Matches(/^[0-9]+$/, { message: 'CVV must contain only digits' })
  cvv: string;

  @IsString()
  @IsNotEmpty()
  // TODO: Consider using an enum for cardType ('debit', 'credit') for better type safety
  cardType: string; 

  // userId will be typically extracted from the authenticated user token in the service/controller
  // and not passed directly in the DTO for security reasons.
  // If you need to associate with a user, handle it in the service layer.
}