import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  async getFeatured(limit = 10): Promise<Product[]> {
    return this.repo.find({
      where: { isFeatured: true },
      order: { name: 'ASC' },
      take: limit,
    });
  }
}
