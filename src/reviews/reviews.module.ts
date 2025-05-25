import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { Review } from './entities/review.entity';
import { Product } from '../products/product.entity';
import { User } from '../entities/user.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Producer } from '../entities/producer.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Review,
      Product,
      User,
      OrderItem,
      Order,
      Producer,
    ]),
  ],
  controllers: [ReviewsController],
  providers: [ReviewsService],
  exports: [ReviewsService],
})
export class ReviewsModule {}
