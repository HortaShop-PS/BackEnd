import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { Producer } from 'src/entities/producer.entity';

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

  async advancedSearch(params: {
    name?: string;
    minPrice?: number;
    maxPrice?: number;
    isFeatured?: boolean;
    isNew?: boolean;
    limit?: number;
    category?: string;
    isOrganic?: boolean;
    harvestSeason?: string;
    origin?: string;
  }): Promise<Product[]> {
    const {
      name,
      minPrice,
      maxPrice,
      isFeatured,
      isNew,
      limit,
      category,
      isOrganic,
      harvestSeason,
      origin
    } = params;
    
    const query = this.repo.createQueryBuilder('product');

    // Filtros existentes
    if (name) {
      query.andWhere({ name: Like(`%${name}%`) });
    }

    if (minPrice !== undefined && maxPrice !== undefined) {
      query.andWhere({ price: Between(minPrice, maxPrice) });
    } else if (minPrice !== undefined) {
      query.andWhere({ price: MoreThanOrEqual(minPrice) });
    } else if (maxPrice !== undefined) {
      query.andWhere({ price: LessThanOrEqual(maxPrice) });
    }

    if (isFeatured !== undefined) {
      query.andWhere({ isFeatured });
    }

    if (isNew !== undefined) {
      query.andWhere({ isNew });
    }

    if (category) {
      query.andWhere({ category });
    }

    if (isOrganic !== undefined) {
      query.andWhere({ isOrganic });
    }
    
    if (harvestSeason) {
      query.andWhere({ harvestSeason });
    }
    
    if (origin) {
      query.andWhere({ origin });
    }

    if (limit) {
      query.take(limit);
    }

    return query.getMany();
  }


async createProduct(createProductDto: CreateProductDto & { producerId: number }) {
  const producerRepo = this.repo.manager.getRepository('producers');
  const producer = await producerRepo.findOne({
    where: { userId: createProductDto.producerId }
  });

  if (!producer) {
    throw new NotFoundException(`Produtor com userId ${createProductDto.producerId} não encontrado`);
  }

  const product = this.repo.create({
      ...createProductDto,
      producer: { id: producer.id }
  });
  await this.repo.save(product);
  return product;
}

async getProductsByProducerId(producerId: number): Promise<Product[]> {
  try {
    const producerRepo = this.repo.manager.getRepository(Producer);
    const producer = await producerRepo.findOne({
      where: { userId: producerId }
    });

    if (!producer) {
      throw new NotFoundException(`Produtor com userId ${producerId} não encontrado`);
    }

   
    return this.repo.find({
      where: { 
        producer: { id: producer.id } 
      },
      order: { createdAt: 'DESC' } as any
    });
  } catch (error) {
    console.error('Erro ao buscar produtos do produtor:', error);
    throw error;
  }
}

async getAllProducts(): Promise<Product[]> {
  try {
    return this.repo.find({
      order: { createdAt: 'DESC' },
      relations: ['producer']
    });
  } catch (error) {
    console.error('Erro ao buscar todos os produtos:', error);
    throw error;
  }
}
}