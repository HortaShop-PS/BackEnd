import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { DeliveryAuthService } from '../../delivery-auth/delivery-auth.service';
import { UserResponseDto } from '../../dto/user.dto';

interface JwtPayload {
  sub: number;
  username?: string;
  email?: string;
  type?: 'user' | 'delivery';
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private usersService: UsersService,
    private deliveryAuthService: DeliveryAuthService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('JWT_SECRET não está definido nas variáveis de ambiente');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload): Promise<UserResponseDto | any> {
    // Se for um entregador
    if (payload.type === 'delivery') {
      const deliveryMan = await this.deliveryAuthService.validateDeliveryMan(payload.sub);
      if (!deliveryMan) {
        throw new UnauthorizedException('Entregador do token não encontrado');
      }
      return { ...deliveryMan, userType: 'delivery' };
    }

    // Se for um usuário normal
    const user = await this.usersService.findOne(payload.sub, ['producer']);
    if (!user) {
      throw new UnauthorizedException('Usuário do token não encontrado');
    }
    return { ...user, userType: 'user' };
  }
}