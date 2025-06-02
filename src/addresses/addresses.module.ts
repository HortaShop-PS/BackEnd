import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AddressesService } from './addresses.service';
import { AddressesController } from './addresses.controller';
import { Address } from './entities/address.entity';
import { User } from '../entities/user.entity';
import { OpenStreetMapService } from './services/openstreetmap.service';

@Module({
  imports: [TypeOrmModule.forFeature([Address, User])],
  controllers: [AddressesController],
  providers: [AddressesService, OpenStreetMapService],
  exports: [AddressesService],
})
export class AddressesModule {}