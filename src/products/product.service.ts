import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
  ) {}

  /** Lista todos os produtos em destaque (featured) – para a Home */
  async getFeatured(limit = 10): Promise<Product[]> {
    return this.repo.find({
      where: { isFeatured: true },
      order: { name: 'ASC' },
      take: limit,
    });
  }

  /* ------------ exemplos de métodos extras, caso precise depois ------
  async findOne(id: string): Promise<Product | null> {
    return this.repo.findOne({ where: { id } });
  }

  async create(dto: CreateProductDto): Promise<Product> {
    const product = this.repo.create(dto);
    return this.repo.save(product);
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    await this.repo.update(id, dto);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    await this.repo.delete(id);
  }
  ------------------------------------------------------------------- */
}