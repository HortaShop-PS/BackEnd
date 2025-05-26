import { Injectable, NotFoundException, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { Producer } from 'src/entities/producer.entity';
import { Review } from '../reviews/entities/review.entity';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product) private readonly repo: Repository<Product>,
    @InjectRepository(Review) private readonly reviewRepo: Repository<Review>,
  ) {}

  async getFeatured(limit = 10): Promise<(Product & { averageRating?: number; totalReviews?: number })[]> {
    const products = await this.repo.find({
      where: { isFeatured: true },
      order: { name: 'ASC' },
      take: limit,
    });
    
    // Buscar avaliações para todos os produtos
    const productsWithReviews = await Promise.all(products.map(async (product) => {
      const reviews = await this.reviewRepo.find({ where: { productId: product.id } });
      
      // Calcular média de avaliações
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...product,
        averageRating,
        totalReviews
      };
    }));
    
    return productsWithReviews;
  }

  async findById(id: string): Promise<Product & { averageRating?: number; totalReviews?: number }> {
    try {
      const product = await this.repo.findOneBy({ id });
      
      if (!product) {
        throw new NotFoundException(`Produto com ID ${id} não encontrado`);
      }
      
      // Buscar avaliações do produto
      const reviews = await this.reviewRepo.find({ where: { productId: id } });
      
      // Calcular média de avaliações
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...product,
        averageRating,
        totalReviews
      };
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
  }): Promise<(Product & { averageRating?: number; totalReviews?: number })[]> {
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

    const products = await query.getMany();
    
    // Buscar avaliações para todos os produtos
    const productsWithReviews = await Promise.all(products.map(async (product) => {
      const reviews = await this.reviewRepo.find({ where: { productId: product.id } });
      
      // Calcular média de avaliações
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...product,
        averageRating,
        totalReviews
      };
    }));
    
    return productsWithReviews;
  }


async createProduct(createProductDto: CreateProductDto & { producerId: number }) {
  const producerRepo = this.repo.manager.getRepository(Producer);
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

  private mapToResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      unit: product.unit,
      imageUrl: product.imageUrl,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      category: product.category,
      isOrganic: product.isOrganic,
      origin: product.origin,
      description: product.description,
      stock: product.stock,
      harvestSeason: product.harvestSeason
    };
  }

  private async mapToResponseDtoWithReviews(product: Product & { averageRating?: number; totalReviews?: number }): Promise<ProductResponseDto> {
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      unit: product.unit,
      imageUrl: product.imageUrl,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      category: product.category,
      isOrganic: product.isOrganic,
      origin: product.origin,
      description: product.description,
      stock: product.stock,
      harvestSeason: product.harvestSeason,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews
    };
  }

  private async findProductByIdAndProducerId(productId: string, userId: number): Promise<Product> {
    const producerRepo = this.repo.manager.getRepository(Producer);
    const producer = await producerRepo.findOne({
      where: { userId }
    });

    if (!producer) {
      throw new NotFoundException(`Produtor não encontrado para o usuário ${userId}`);
    }

    const product = await this.repo.findOne({
      where: { 
        id: productId,
        producer: { id: producer.id }
      },
      relations: ['producer']
    });

    if (!product) {
      throw new NotFoundException(`Produto com ID ${productId} não encontrado ou não pertence ao produtor`);
    }

    return product;
  }

  async createProductForProducer(createProductDto: CreateProductDto, userId: number): Promise<ProductResponseDto> {
    const producerRepo = this.repo.manager.getRepository(Producer);
    const producer = await producerRepo.findOne({
      where: { userId }
    });

    if (!producer) {
      throw new NotFoundException(`Produtor não encontrado para o usuário ${userId}`);
    }

    const product = this.repo.create({
      ...createProductDto,
      producer: { id: producer.id }
    });

    const savedProduct = await this.repo.save(product);
    
    // Produto novo não tem reviews ainda
    const productWithReviews = {
      ...savedProduct,
      averageRating: 0,
      totalReviews: 0
    };
    
    return this.mapToResponseDtoWithReviews(productWithReviews);
  }

  async getProductsByProducerId(userId: number): Promise<ProductResponseDto[]> {
    const producerRepo = this.repo.manager.getRepository(Producer);
    const producer = await producerRepo.findOne({
      where: { userId }
    });

    if (!producer) {
      throw new NotFoundException(`Produtor não encontrado para o usuário ${userId}`);
    }

    const products = await this.repo.find({
      where: { 
        producer: { id: producer.id } 
      },
      order: { createdAt: 'DESC' }
    });

    // Mapear produtos com reviews
    const productsWithReviews = await Promise.all(products.map(async (product) => {
      const reviews = await this.reviewRepo.find({ where: { productId: product.id } });
      
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...product,
        averageRating,
        totalReviews
      };
    }));

    return Promise.all(productsWithReviews.map(p => this.mapToResponseDtoWithReviews(p)));
  }

  async getProductByIdForProducer(productId: string, userId: number): Promise<ProductResponseDto> {
    const product = await this.findProductByIdAndProducerId(productId, userId);
    
    // Buscar reviews para este produto
    const reviews = await this.reviewRepo.find({ where: { productId: product.id } });
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const productWithReviews = {
      ...product,
      averageRating,
      totalReviews
    };

    return this.mapToResponseDtoWithReviews(productWithReviews);
  }

  async updateProductForProducer(
    productId: string, 
    updateProductDto: UpdateProductDto, 
    userId: number
  ): Promise<ProductResponseDto> {
    const product = await this.findProductByIdAndProducerId(productId, userId);

    Object.assign(product, updateProductDto);
    
    const updatedProduct = await this.repo.save(product);
    
    // Buscar reviews para o produto atualizado
    const reviews = await this.reviewRepo.find({ where: { productId: updatedProduct.id } });
    
    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
      : 0;

    const productWithReviews = {
      ...updatedProduct,
      averageRating,
      totalReviews
    };

    return this.mapToResponseDtoWithReviews(productWithReviews);
  }

  async deleteProductForProducer(productId: string, userId: number): Promise<void> {
    const product = await this.findProductByIdAndProducerId(productId, userId);
    await this.repo.remove(product);
  }

  async getAllProducts(): Promise<(Product & { averageRating?: number; totalReviews?: number })[]> {
  try {
    const products = await this.repo.find({
      order: { createdAt: 'DESC' },
      relations: ['producer']
    });
    
    // Buscar avaliações para todos os produtos
    const productsWithReviews = await Promise.all(products.map(async (product) => {
      const reviews = await this.reviewRepo.find({ where: { productId: product.id } });
      
      // Calcular média de avaliações
      const totalReviews = reviews.length;
      const averageRating = totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;
      
      return {
        ...product,
        averageRating,
        totalReviews
      };
    }));
    
    return productsWithReviews;
  } catch (error) {
    console.error('Erro ao buscar todos os produtos:', error);
    throw error;
  }
}

async decreaseStock(orderId: string): Promise<void> {
  // In a real application, you would fetch order details to get products and quantities
  // For now, let's assume an order has a direct relation to products or a list of product IDs and quantities
  // This is a simplified example: decrement stock for a product associated with the order.
  // You'll need to adapt this based on your actual Order entity and relations.
  console.log(`Decreasing stock for order ${orderId}`);
  // Example: find a product related to the order and decrease its stock
  // const order = await this.orderRepository.findOne({ where: { id: orderId }, relations: ["items", "items.product"] });
  // if (order && order.items) {
  //   for (const item of order.items) {
  //     const product = await this.repo.findOneBy({ id: item.productId });
  //     if (product && product.stock >= item.quantity) {
  //       product.stock -= item.quantity;
  //       await this.repo.save(product);
  //     } else if (product) {
  //       console.warn(`Not enough stock for product ${product.id} to fulfill order ${orderId}`);
  //       // Handle insufficient stock (e.g., throw error, notify admin)
  //     }
  //   }
  // }
}
}
