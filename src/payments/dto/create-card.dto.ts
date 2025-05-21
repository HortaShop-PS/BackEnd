import { IsString, IsNotEmpty, Length, Matches } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  @Length(13, 19)
  @Matches(/^[0-9]+$/, { message: 'O número do cartão deve conter apenas dígitos' })
  number: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^(0[1-9]|1[0-2])\/([0-9]{2})$/, {
    message: 'A data de validade deve estar no formato MM/AA',
  })
  expiry: string; // MM/AA

  @IsString()
  @IsNotEmpty()
  @Length(3, 4)
  @Matches(/^[0-9]+$/, { message: 'O CVV deve conter apenas dígitos' })
  cvv: string;

  @IsString()
  @IsNotEmpty()
  // TODO: Considerar usar um enum para cardType ('débito', 'crédito') para melhor segurança de tipo
  cardType: string; 

  // userId será tipicamente extraído do token de usuário autenticado no service/controller
  // e não passado diretamente no DTO por razões de segurança.
  // Se você precisar associar a um usuário, faça isso na camada de serviço.
}