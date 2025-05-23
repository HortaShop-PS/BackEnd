import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrdersController, ProducerOrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../entities/user.entity';
import { Producer } from '../entities/producer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Product, User, Producer]),
  ],
  controllers: [OrdersController, ProducerOrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}