import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DeliveryOrdersService } from './delivery-orders.service';
import { DeliveryOrdersController } from './delivery-orders.controller';
import { Order } from '../orders/entities/order.entity';
import { Checkout } from '../checkout/entities/checkout.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Order, Checkout])],
  controllers: [DeliveryOrdersController],
  providers: [DeliveryOrdersService],
  exports: [DeliveryOrdersService],
})
export class DeliveryOrdersModule {}