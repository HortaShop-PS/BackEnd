import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from '../products/product.entity';
import { User } from '../entities/user.entity';
import { Producer } from '../entities/producer.entity';
import { OrderDetailResponseDto, OrderItemResponseDto, OrderSummaryResponseDto } from './dto/order-response.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Producer)
    private readonly producerRepository: Repository<Producer>,
  ) {}

  async createOrder(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    // Verificar se o usuário existe
    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    // Buscar todos os produtos de uma vez
    const productIds = createOrderDto.items.map(item => item.productId);
    const products = await this.productRepository.find({
      where: { id: In(productIds) },
      relations: ['producer'],
    });

    // Verificar se todos os produtos existem
    if (products.length !== productIds.length) {
      throw new BadRequestException('Um ou mais produtos não foram encontrados');
    }

    // Criar o pedido
    const order = this.orderRepository.create({
      userId,
      user,
      status: createOrderDto.status || OrderStatus.PENDING,
      shippingAddress: createOrderDto.shippingAddress,
      paymentMethod: createOrderDto.paymentMethod,
      totalPrice: 0, // Será calculado abaixo
    });

    // Salvar o pedido para obter o ID
    await this.orderRepository.save(order);

    // Criar os itens do pedido
    const orderItems: OrderItem[] = [];
    let totalPrice = 0;

    for (const itemDto of createOrderDto.items) {
      const product = products.find(p => p.id === itemDto.productId);
      
      // Verificar se o produto existe antes de acessar suas propriedades
      if (!product) {
        throw new BadRequestException(`Produto com ID ${itemDto.productId} não encontrado`);
      }
      
      const orderItem = this.orderItemRepository.create({
        order,
        product,
        productId: product.id,
        producer: product.producer,
        producerId: product.producer.id,
        quantity: itemDto.quantity,
        unitPrice: product.price,
        totalPrice: product.price * itemDto.quantity,
        notes: itemDto.notes,
      });
  
      orderItems.push(orderItem);
      totalPrice += orderItem.totalPrice;
    }

    // Salvar os itens do pedido
    await this.orderItemRepository.save(orderItems);

    // Atualizar o preço total do pedido
    order.totalPrice = totalPrice;
    order.items = orderItems;
    await this.orderRepository.save(order);

    return order;
  }

  async getOrdersByUserId(userId: number): Promise<OrderSummaryResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['items'],
    });

    return orders.map(order => ({
      id: order.id,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      itemCount: order.items.length,
    }));
  }

  async getOrdersByProducerId(producerId: number): Promise<OrderSummaryResponseDto[]> {
    // Buscar o produtor
    const producer = await this.producerRepository.findOne({
      where: { userId: producerId }
    });

    if (!producer) {
      throw new NotFoundException(`Produtor com userId ${producerId} não encontrado`);
    }

    // Buscar todos os itens de pedido deste produtor
    const orderItems = await this.orderItemRepository.find({
      where: { producerId: producer.id },
      relations: ['order', 'order.items'],
    });

    // Agrupar por pedido
    const orderMap = new Map<string, Order>();
    for (const item of orderItems) {
      if (!orderMap.has(item.order.id)) {
        orderMap.set(item.order.id, item.order);
      }
    }

    const orders = Array.from(orderMap.values());
    
    return orders.map(order => ({
      id: order.id,
      status: order.status,
      totalPrice: order.totalPrice,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      itemCount: order.items.length,
    }));
  }

  async getOrderById(orderId: string, userId?: number): Promise<OrderDetailResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'items.producer'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido com ID ${orderId} não encontrado`);
    }

    // Se um userId foi fornecido, verificar se o pedido pertence a este usuário
    if (userId && order.userId !== userId) {
      throw new NotFoundException(`Pedido com ID ${orderId} não encontrado para este usuário`);
    }

    const itemsResponse: OrderItemResponseDto[] = await Promise.all(
      order.items.map(async (item) => {
        return {
          id: item.id,
          productId: item.productId,
          productName: item.product.name,
          productImage: item.product.imageUrl,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          producerId: item.producerId,
          // Corrigir o acesso à propriedade 'name' que não existe em Producer
          // Assumindo que o nome do produtor está em farmName ou em user.name
          producerName: item.producer.farmName || (item.producer.user?.name || 'Produtor'),
          notes: item.notes,
        };
      })
    );

    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalPrice: order.totalPrice,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      trackingCode: order.trackingCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: itemsResponse,
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOneBy({ id: orderId });
    
    if (!order) {
      throw new NotFoundException(`Pedido com ID ${orderId} não encontrado`);
    }

    order.status = status;
    return this.orderRepository.save(order);
  }
}