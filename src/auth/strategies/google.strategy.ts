import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback, Profile } from 'passport-google-oauth20';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service'; // Para validar/criar usuário

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService, // Injeta AuthService
  ) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID')!,
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET')!,
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL')!, // URL de callback
      scope: ['email', 'profile'], // Escopos solicitados ao Google
    });
  }

  /**
   * Chamado pelo Passport após o Google redirecionar de volta com sucesso.
   * Recebe informações do perfil do Google.
   */
  async validate(
    accessToken: string, // Não costumamos usar diretamente, mas está disponível
    refreshToken: string, // Pode ser útil para acesso offline (não usado aqui)
    profile: Profile, // Informações do usuário do Google
    done: VerifyCallback,
  ): Promise<any> {
    const { id, name, emails, photos } = profile;
    if (!emails || emails.length === 0) {
      return done(
        new UnauthorizedException('Não foi possível obter o email do Google.'),
        false,
      );
    }

    const googleUser = {
      provider: 'google',
      providerId: id,
      email: emails[0].value, // Pega o primeiro email (geralmente o principal)
      name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
      picture: photos?.[0]?.value,
    };

    try {
      // Chama um método no AuthService para encontrar ou criar o usuário
      const user = await this.authService.validateOAuthLogin(googleUser);
      // Se encontrar/criar, passa o usuário para o Passport
      done(null, user);
    } catch (err) {
      // Se houver erro na validação/criação, passa o erro para o Passport
      done(err, false);
    }
  }
}
