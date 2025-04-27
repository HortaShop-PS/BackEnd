import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginAuthDto {
  @IsNotEmpty({ message: 'O email não pode estar vazio' })
  @IsEmail({}, { message: 'Formato de email inválido' })
  email: string;

  @IsNotEmpty({ message: 'A senha não pode estar vazia' })
  @IsString()
  // Você pode adicionar @MinLength se quiser validar o tamanho mínimo aqui também,
  // embora a validação principal ocorra na comparação do hash.
  // @MinLength(6, { message: 'A senha deve ter no mínimo 6 caracteres' })
  password: string;
}
