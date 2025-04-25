// filepath: /home/andre/dev/hortaShop/BackEnd/src/auth/guards/local-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

// Este guard ativa a estratégia 'local' que foi registrada no AuthModule.
// Ele tentará validar as credenciais (email/senha) usando a LocalStrategy.
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
