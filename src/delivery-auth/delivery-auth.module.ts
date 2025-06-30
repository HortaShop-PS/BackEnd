import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { DeliveryAuthService } from './delivery-auth.service';
import { DeliveryAuthController } from './delivery-auth.controller';
import { DeliveryMan } from '../entities/delivery-man.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([DeliveryMan]),
    ConfigModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  controllers: [DeliveryAuthController],
  providers: [DeliveryAuthService],
  exports: [DeliveryAuthService],
})
export class DeliveryAuthModule {}