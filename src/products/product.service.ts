import { Injectable, NotFoundException } from '@nestjs/common';
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

  async findById(id: string): Promise<Product> {
    try {
      const product = await this.repo.findOneBy({ id });
      
      if (!product) {
        throw new NotFoundException(`Produto com ID ${id} não encontrado`);
      }
      
      return product;
    } catch (error) {
      console.error('Erro ao buscar produto:', error);
      throw error;
    }
  }
}
