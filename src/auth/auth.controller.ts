// filepath: /home/andre/dev/hortaShop/BackEnd/src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common'; // Adicionado Get, Req, Res
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { UserResponseDto } from '../dto/user.dto';
import { AuthGuard } from '@nestjs/passport'; // Importar AuthGuard
import { Response } from 'express'; // Importar Response do express

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // --- Endpoints existentes ---
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: { user: UserResponseDto }) {
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(
    @Body() registerAuthDto: RegisterAuthDto,
  ): Promise<UserResponseDto> {
    return this.authService.register(registerAuthDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: { user: UserResponseDto }): UserResponseDto {
    return req.user;
  }

  // --- Endpoints Google OAuth ---

  /**
   * GET /auth/google
   * Inicia o fluxo de autenticação do Google.
   * O AuthGuard('google') redireciona automaticamente para a página de login do Google.
   */
  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Este endpoint não precisa de lógica, o Guard faz o redirecionamento.
  }

  /**
   * GET /auth/google/callback
   * Google redireciona para cá após o usuário autorizar.
   * O AuthGuard('google') processa o código, chama a GoogleStrategy.validate.
   * Se validate for bem-sucedido, req.user conterá o usuário retornado por validate.
   */
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: { user: UserResponseDto },
    @Res() res: Response,
  ) {
    // req.user foi populado pela GoogleStrategy
    if (!req.user) {
      // Se algo deu errado e não temos usuário
      // Redirecionar para uma página de erro no frontend
      // return res.redirect('http://SEU_FRONTEND_URL/auth/error');
      return res
        .status(401)
        .json({ message: 'Falha na autenticação com Google' });
    }

    // Gera o token JWT para o usuário validado/criado
    const tokenData = await this.authService.login(req.user);

    // --- IMPORTANTE: Enviar o token para o Frontend ---
    // A melhor abordagem para mobile (React Native/Expo) é redirecionar
    // para um custom scheme da sua aplicação, passando o token como parâmetro.
    // Ex: myapp://auth/callback?token=SEU_TOKEN_JWT
    // Configure isso no seu frontend (expo-linking ou expo-auth-session).

    // Exemplo de redirecionamento (ajuste a URL e o nome do parâmetro):
    const frontendRedirectUrl = `SEU_APP_SCHEME://auth/callback?token=${tokenData.access_token}`;
    console.log(`Redirecionando para: ${frontendRedirectUrl}`);
    return res.redirect(frontendRedirectUrl);

    // Alternativa (menos comum para mobile): Retornar o token como JSON
    // return tokenData;
  }
}
