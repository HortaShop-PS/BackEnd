import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { Product } from '../products/product.entity';
import { User } from '../entities/user.entity';
import { OrderItem } from '../orders/entities/order-item.entity';
import { Order } from '../orders/entities/order.entity';
import { Producer } from '../entities/producer.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ReviewResponseDto,
  ProductReviewsResponseDto,
} from './dto/review-response.dto';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,
  ) {}

  private mapToReviewResponseDto(review: Review): ReviewResponseDto {
    return {
      id: review.id,
      userId: review.userId,
      userName: review.user?.name || 'Usuário',
      productId: review.productId,
      productName: review.product?.name || 'Produto',
      rating: review.rating,
      comment: review.comment,
      producerId: review.producerId,
      producerName:
        review.producer?.farmName || review.producer?.user?.name || 'Produtor',
      producerRating: review.producerRating,
      producerComment: review.producerComment,
      orderRating: review.orderRating,
      orderComment: review.orderComment,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt,
    };
  }

  async createReview(
    userId: number,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    const {
      productId,
      rating,
      comment,
      orderItemId,
      producerId,
      producerRating,
      producerComment,
      orderRating,
      orderComment,
    } = createReviewDto;

    // Verificar se o produto existe
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Produto com ID ${productId} não encontrado`);
    }

    // Verificar se o usuário existe
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Verificar se o produtor existe (quando fornecido)
    let producer: Producer | null = null;
    if (producerId) {
      producer = await this.producerRepository.findOne({
        where: { id: producerId },
        relations: ['user'],
      });
      if (!producer) {
        throw new NotFoundException(
          `Produtor com ID ${producerId} não encontrado`,
        );
      }
    }

    // Se orderItemId foi fornecido, verificar se o item do pedido existe e pertence ao usuário
    if (orderItemId) {
      const orderItem = await this.orderItemRepository.findOne({
        where: { id: orderItemId },
        relations: ['order'],
      });

      if (!orderItem) {
        throw new NotFoundException(
          `Item de pedido com ID ${orderItemId} não encontrado`,
        );
      }

      if (orderItem.order.userId !== userId) {
        throw new ForbiddenException(
          'Você não tem permissão para avaliar este item de pedido',
        );
      }

      // Verificar se o pedido está entregue
      const order = await this.orderRepository.findOne({
        where: { id: orderItem.order.id },
      });
      if (!order) {
        throw new NotFoundException(
          `Pedido com ID ${orderItem.order.id} não encontrado`,
        );
      }
      if (order.status !== OrderStatus.DELIVERED) {
        throw new BadRequestException(
          'Só é possível avaliar produtos de pedidos entregues',
        );
      }

      // Verificar se o produto do item de pedido corresponde ao produto informado
      if (orderItem.productId !== productId) {
        throw new BadRequestException(
          'O produto informado não corresponde ao item do pedido',
        );
      } // Verificar se o usuário já avaliou este item de pedido
      const existingReview = await this.reviewRepository.findOne({
        where: { orderItemId },
      });

      console.log(
        `DEBUG - Review creation check for orderItem ${orderItemId}, userId: ${userId}`,
        { existingReview: !!existingReview },
      );

      if (existingReview) {
        throw new BadRequestException('Você já avaliou este item de pedido');
      }
    } else {
      // Se não foi fornecido orderItemId, verificar se o usuário já avaliou este produto
      const existingReview = await this.reviewRepository.findOne({
        where: { userId, productId },
      });

      if (existingReview) {
        throw new BadRequestException('Você já avaliou este produto');
      }

      // Verificar se o usuário comprou o produto
      const userOrders = await this.orderRepository.find({
        where: { userId, status: OrderStatus.DELIVERED },
        relations: ['items'],
      });

      const hasBoughtProduct = userOrders.some((order) =>
        order.items.some((item) => item.productId === productId),
      );

      if (!hasBoughtProduct) {
        throw new BadRequestException(
          'Você precisa ter comprado o produto para avaliá-lo',
        );
      }
    } // Criar a avaliação
    const review = this.reviewRepository.create({
      userId,
      user,
      productId,
      product,
      orderItemId,
      rating,
      comment,
      producerId,
      ...(producer && { producer }), // Conditionally include producer
      producerRating,
      producerComment,
      orderRating,
      orderComment,
    });

    const savedReview = await this.reviewRepository.save(review);
    console.log(
      `DEBUG - Review created successfully for orderItem ${orderItemId}, userId: ${userId}, reviewId: ${savedReview.id}`,
    );

    return this.mapToReviewResponseDto(savedReview);
  }

  async getProductReviews(
    productId: string,
  ): Promise<ProductReviewsResponseDto> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Produto com ID ${productId} não encontrado`);
    }

    const reviews = await this.reviewRepository.find({
      where: { productId },
      relations: ['user', 'producer', 'producer.user'],
      order: { createdAt: 'DESC' },
    });

    const reviewsResponse = reviews.map((review) =>
      this.mapToReviewResponseDto(review),
    );

    // Calcular a média das avaliações
    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    return {
      productId,
      productName: product.name,
      averageRating,
      totalReviews,
      reviews: reviewsResponse,
    };
  }

  async getUserReviews(userId: number): Promise<ReviewResponseDto[]> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    const reviews = await this.reviewRepository.find({
      where: { userId },
      relations: ['product', 'producer', 'producer.user'],
      order: { createdAt: 'DESC' },
    });

    return reviews.map((review) => this.mapToReviewResponseDto(review));
  }

  async deleteReview(userId: number, reviewId: string): Promise<void> {
    const review = await this.reviewRepository.findOne({
      where: { id: reviewId },
    });

    if (!review) {
      throw new NotFoundException(
        `Avaliação com ID ${reviewId} não encontrada`,
      );
    }

    if (review.userId !== userId) {
      throw new ForbiddenException(
        'Você não tem permissão para excluir esta avaliação',
      );
    }

    await this.reviewRepository.remove(review);
  }
}
