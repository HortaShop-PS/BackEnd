import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from 'class-validator';

export class RegisterAuthDto {
  @IsNotEmpty({ message: 'O nome não pode estar vazio' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  @IsEmail({}, { message: 'Formato de email inválido' })
  email: string;

  @IsNotEmpty({ message: 'A senha não pode estar vazia' })
  @IsString()
  @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;
}
