import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RegisterAuthDto } from './dto/register-auth.dto';
import { UserResponseDto } from '../dto/user.dto';

interface OAuthUser {
  provider: string;
  providerId: string;
  email: string;
  name: string;
  picture?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) { }

  async validateUser(
    email: string,
    pass: string,
  ): Promise<UserResponseDto | null> {
    const user = await this.usersService.findByEmail(email);
    if (user && user.password && await bcrypt.compare(pass, user.password)) {
      const { password, ...result } = user;
      return result as UserResponseDto;
    }
    return null;
  }

  async login(user: UserResponseDto) {
    const payload = { 
        email: user.email,
        sub: user.id,
        userType: user.userType, 
        producerId: user.producer?.id || null 
    };
    return {
        access_token: this.jwtService.sign(payload),
        userType: user.userType,
    };
}

  async register(registerAuthDto: RegisterAuthDto): Promise<UserResponseDto> {
    try {
      const hashedPassword = await bcrypt.hash(registerAuthDto.password, 10);

      const newUser = await this.usersService.create({
        name: registerAuthDto.name,
        email: registerAuthDto.email,
        password: hashedPassword,
        phone: registerAuthDto.phoneNumber,
        userType: 'consumer',
      });

      const { password, ...result } = newUser;
      return result as UserResponseDto;
    } catch (error) {
      console.error('Erro ao registrar usuário:', error);
      throw new InternalServerErrorException('Erro ao registrar usuário');
    }
  }

  async validateOAuthLogin(oauthUser: OAuthUser): Promise<UserResponseDto> {
    try {
      let user = await this.usersService.findByEmail(oauthUser.email);

      if (user) {
        console.log(`Usuário OAuth encontrado: ${user.email}`);
      } else {
        console.log(`Criando novo usuário OAuth: ${oauthUser.email}`);
        const newUser = await this.usersService.create({
          email: oauthUser.email,
          name: oauthUser.name,
          userType: 'consumer',
        });
        user = newUser;
      }
      const { password, ...result } = user;
      return result as UserResponseDto;
    } catch (error) {
      console.error('Erro ao validar/criar usuário OAuth:', error);
      throw new InternalServerErrorException('Erro ao processar login OAuth');
    }
  }
}
