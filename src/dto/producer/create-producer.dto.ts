import { IsEmail, IsOptional, IsPhoneNumber, IsNotEmpty, MinLength, IsString } from 'class-validator';

export class CreateProducerDto {
  @IsOptional()
  @IsEmail({}, { message: 'Formato de e-mail inválido.' })
  email?: string;

  @IsOptional()
  @IsPhoneNumber('BR', { message: 'Número de telefone inválido.' })
  phoneNumber?: string;

  @IsNotEmpty({ message: 'A senha não pode estar vazia.' })
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres.' })
  password!: string;

}