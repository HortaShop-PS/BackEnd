// filepath: /home/andre/dev/hortaShop/BackEnd/src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Este guard ativa a estratégia 'jwt' que foi registrada no AuthModule.
// Ele tentará validar o token JWT presente na requisição usando a JwtStrategy.
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
