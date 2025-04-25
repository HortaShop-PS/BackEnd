// filepath: /home/andre/dev/hortaShop/BackEnd/src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service'; // Para buscar dados do usuário
import { UserResponseDto } from '../../dto/user.dto'; // Importe o DTO de resposta

// Define a estrutura esperada do payload dentro do token JWT
interface JwtPayload {
  sub: number; // 'sub' (subject) geralmente guarda o ID do usuário
  username: string; // Pode ser o email ou outro identificador
  // Adicione outros campos que você incluir no payload ao gerar o token
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService, // Injeta UsersService para buscar o usuário
  ) {
    // Lê a chave secreta do .env para verificar a assinatura do token
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      // Garante que a chave secreta está definida ao iniciar
      throw new Error('JWT_SECRET não está definido nas variáveis de ambiente');
    }
    super({
      // Define como extrair o token da requisição (do cabeçalho Authorization como Bearer Token)
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      // Garante que tokens expirados sejam rejeitados
      ignoreExpiration: false,
      // Fornece a chave secreta para o Passport verificar a assinatura do token
      secretOrKey: secret,
    });
  }

  // Este método é chamado pelo Passport *após* verificar a assinatura e a expiração do token.
  // Ele recebe o payload decodificado do token como argumento.
  async validate(payload: JwtPayload): Promise<UserResponseDto> {
    // Usa o ID ('sub') do payload para buscar o usuário no banco de dados.
    // Isso garante que o usuário ainda existe e obtém os dados mais recentes.
    const user = await this.usersService.findOne(payload.sub); // findOne deve retornar UserResponseDto
    if (!user) {
      // Se o usuário não for encontrado (pode ter sido excluído após o token ser gerado), rejeita.
      throw new UnauthorizedException('Usuário do token não encontrado');
    }
    // Se o usuário for encontrado, retorna o objeto do usuário (sem senha).
    // O Passport anexará este objeto retornado a `request.user`.
    return user;
  }
}
