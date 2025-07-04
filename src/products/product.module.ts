import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductController } from './product.controller';
import { ProducerProductsController } from './producer-products.controller';
import { ProductService } from './product.service';
import { Product } from './product.entity';
import { Review } from '../reviews/entities/review.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Product, Review])],
  controllers: [ProductController, ProducerProductsController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductsModule {}