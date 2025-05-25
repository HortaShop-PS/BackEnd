import {
  Controller,
  Post,
  Body,
  Request,
  UseGuards,
  Get,
  Req,
  Res,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { UserResponseDto } from '../dto/user.dto';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req: { user: UserResponseDto }) {
    // Adicionar log para verificar se o userType está sendo retornado
    console.log('Usuário autenticado:', {
      id: req.user.id,
      userType: req.user.userType,
    });

    return this.authService.login({
      ...req.user,
      // Garantir que userType está sendo passado corretamente
      userType: req.user.userType || 'consumer',
    });
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

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(
    @Req() req: { user: UserResponseDto },
    @Res() res: Response,
  ) {
    if (!req.user) {
      return res
        .status(401)
        .json({ message: 'Falha na autenticação com Google' });
    }

    const tokenData = await this.authService.login(req.user);

    const frontendRedirectUrl = `SEU_APP_SCHEME://auth/callback?token=${tokenData.access_token}`;
    console.log(`Redirecionando para: ${frontendRedirectUrl}`);
    return res.redirect(frontendRedirectUrl);
  }
}
