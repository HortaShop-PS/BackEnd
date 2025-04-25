import { Module } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';
import { AuthController } from '../auth/auth.controller';
import { UsersModule } from '../users/users.module'; // Importa UsersModule para usar UsersService
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { LocalStrategy } from '../auth/strategies/local.strategy'; // Será criado no Passo 4
import { JwtStrategy } from '../auth/strategies/jwt.strategy'; // Será criado no Passo 4
import { GoogleStrategy } from '../auth/strategies/google.strategy'; // Será criado no Passo 4

@Module({
  imports: [
    UsersModule, // Disponibiliza UsersService para injeção no AuthService
    PassportModule, // Módulo base do Passport
    ConfigModule, // Necessário para ler JWT_SECRET do .env via ConfigService
    JwtModule.registerAsync({
      // Configura o JwtModule de forma assíncrona para poder usar ConfigService
      imports: [ConfigModule], // Importa ConfigModule para o contexto do factory
      inject: [ConfigService], // Injeta ConfigService no factory
      useFactory: (configService: ConfigService) => ({
        // Lê a chave secreta do .env
        secret: configService.get<string>('JWT_SECRET'),
        // Define opções de assinatura, como o tempo de expiração
        signOptions: { expiresIn: '1d' }, // Ex: Token válido por 1 dia
      }),
    }),
  ],
  controllers: [AuthController], // Controlador para os endpoints /auth/login, /auth/register, etc.
  providers: [
    AuthService, // Serviço com a lógica de negócio da autenticação
    LocalStrategy, // Registra a estratégia para validar email/senha
    JwtStrategy, // Registra a estratégia para validar o token JWT
    GoogleStrategy, // Registra a estratégia para autenticação via Google
  ],
  exports: [AuthService], // Exporta AuthService caso outros módulos precisem dele
})
export class AuthModule {}
