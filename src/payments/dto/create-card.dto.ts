import { IsString, IsNotEmpty, Length, Matches, IsOptional } from 'class-validator';

export class CreateCardDto {
  @IsString()
  @IsNotEmpty()
  @Length(13, 19)
  @Matches(/^[0-9]+$/, { message: 'O número do cartão deve conter apenas dígitos' })
  number: string;

  @IsString()
  @IsNotEmpty()
  cardholderName: string;

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
  // TODO: Considerar usar um enum para brand ('visa', 'mastercard') para melhor segurança de tipo
  brand: string; 

  @IsString()
  @IsOptional()
  @Length(1, 50) // Definindo um tamanho para o apelido
  nickname?: string;

  @IsString()
  @IsOptional()
  // TODO: Considerar usar um enum aqui também: 'credit', 'debit'
  paymentMethodType?: string; // 'credit' or 'debit'

  // userId será tipicamente extraído do token de usuário autenticado no service/controller
  // e não passado diretamente no DTO por razões de segurança.
  // Se você precisar associar a um usuário, faça isso na camada de serviço.
}