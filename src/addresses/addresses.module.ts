import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { Address } from './entities/address.entity';
import { User } from '../entities/user.entity';
import { GoogleMapsService } from './services/google-maps.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Address, User]),
    ConfigModule,
  ],
  controllers: [AddressesController],
  providers: [AddressesService, GoogleMapsService],
  exports: [AddressesService, GoogleMapsService],
})
export class AddressesModule {}