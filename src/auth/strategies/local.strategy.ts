
import { Strategy } from 'passport-local';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { User } from '../../entities/user.entity'; // Importe sua entidade User
import { UserResponseDto } from '../../dto/user.dto'; // Importe o DTO de resposta

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    // Configura a estratégia 'local'. Por padrão, ela espera 'username' e 'password'.
    // Aqui, mudamos para esperar 'email' e 'password' no corpo da requisição.
    super({ usernameField: 'email' });
  }

  // Este método é chamado automaticamente pelo Passport quando a estratégia 'local' é usada.
  // Ele recebe os campos definidos em `super()` (email e password).
  async validate(email: string, password: string): Promise<UserResponseDto> {
    // Chama o método validateUser do AuthService para verificar as credenciais no DB.
    const user = await this.authService.validateUser(email, password);
    if (!user) {
      // Se validateUser retornar null, as credenciais são inválidas.
      throw new UnauthorizedException('Credenciais inválidas');
    }
    // Se as credenciais forem válidas, retorna o objeto do usuário (sem senha).
    // O Passport anexará este objeto retornado a `request.user`.
    return user;
  }
}
