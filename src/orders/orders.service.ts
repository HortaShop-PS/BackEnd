import { Injectable, NotFoundException, ForbiddenException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrderStatusHistory, HistoryOrderStatus } from '../entities/order-status-history.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from '../products/product.entity';
import { User } from '../entities/user.entity';
import { Producer } from '../entities/producer.entity';
import { Review } from '../reviews/entities/review.entity';
import { OrderDetailResponseDto, OrderItemResponseDto, OrderSummaryResponseDto } from './dto/order-response.dto';
import { UpdateOrderStatusDto, NotifyReadyDto, OrderStatusDto } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private orderItemRepository: Repository<OrderItem>,
    @InjectRepository(Producer)
    private producerRepository: Repository<Producer>,
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(OrderStatusHistory)
    private statusHistoryRepository: Repository<OrderStatusHistory>,
  ) {}

  async createOrder(userId: number, createOrderDto: CreateOrderDto): Promise<Order> {
    return await this.orderRepository.manager.transaction(async manager => {
      const user = await manager.findOneBy(User, { id: userId });
      if (!user) {
        throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
      }

      const productIds = createOrderDto.items.map(item => item.productId);
      const products = await manager.find(Product, {
        where: { id: In(productIds) },
        relations: ['producer']
      });
  
      if (products.length !== productIds.length) {
        throw new BadRequestException('Um ou mais produtos não foram encontrados');
      }
  
      const order = manager.create(Order, {
        userId,
        user,
        status: createOrderDto.status || OrderStatus.PENDING,
        shippingAddress: createOrderDto.shippingAddress,
        paymentMethod: createOrderDto.paymentMethod,
        totalPrice: 0,
      });
  
      await manager.save(order);
  
      const orderItems: OrderItem[] = [];
      let totalPrice = 0;
  
      for (const itemDto of createOrderDto.items) {
        const product = products.find(p => p.id === itemDto.productId);
        
        if (!product) {
          throw new BadRequestException(`Produto com ID ${itemDto.productId} não encontrado`);
        }
        
        const orderItem = manager.create(OrderItem, {
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
  
      await manager.save(orderItems);
  
      order.totalPrice = totalPrice;
      order.items = orderItems;
      await manager.save(order);
  
      return order;
    });
  }

  async getOrdersByUserId(userId: number): Promise<OrderSummaryResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      relations: ['items', 'items.product', 'items.producer', 'items.producer.user'],
    });

    return orders.map(order => ({
      id: order.id,
      status: order.status,
      totalPrice: Number(order.totalPrice) || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      itemCount: order.items.length,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        productName: item.product?.name || 'Produto não encontrado',
        productImage: item.product?.imageUrl || '',
        quantity: item.quantity,
        unitPrice: Number(item.unitPrice) || 0,
        totalPrice: Number(item.totalPrice) || 0,
        producerId: item.producerId,
        producerName: item.producer?.farmName || item.producer?.user?.name || 'Produtor',
        notes: item.notes,
        reviewed: false,
      })),
    }));
  }

  async getOrdersByProducerId(producerId: number): Promise<OrderSummaryResponseDto[]> {
    const producer = await this.producerRepository.findOne({
      where: { userId: producerId }
    });

    if (!producer) {
      throw new NotFoundException(`Produtor com userId ${producerId} não encontrado`);
    }

    const orderItems = await this.orderItemRepository.find({
      where: { producerId: producer.id },
      relations: ['order', 'order.items'],
    });

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
      totalPrice: Number(order.totalPrice) || 0,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      itemCount: order.items.length,
      readyForPickup: order.readyForPickup || false, // ← ADICIONAR ESTA LINHA
    }));
  }

  async getOrderById(orderId: string, userId?: number): Promise<OrderDetailResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'items.producer', 'items.producer.user'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido com ID ${orderId} não encontrado`);
    }

    const itemsResponse: OrderItemResponseDto[] = await Promise.all(
      order.items.map(async (item) => {
        const review = await this.reviewRepository.findOne({
          where: { 
            orderItemId: item.id,
            userId: userId
          }
        });
        
        return {
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || 'Produto não encontrado',
          productImage: item.product?.imageUrl || '',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0,
          producerId: item.producerId,
          producerName: item.producer?.farmName || item.producer?.user?.name || 'Produtor',
          notes: item.notes,
          reviewed: !!review,
        };
      })
    );

    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalPrice: Number(order.totalPrice) || 0,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      trackingCode: order.trackingCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: itemsResponse,
    };
  }

  async getProducerOrderDetails(orderId: string, producerUserId: number): Promise<OrderDetailResponseDto> {
    const producer = await this.producerRepository.findOne({
      where: { userId: producerUserId }
    });

    if (!producer) {
      throw new NotFoundException(`Produtor com userId ${producerUserId} não encontrado`);
    }

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'items.producer', 'items.producer.user', 'user'],
    });

    if (!order) {
      throw new NotFoundException(`Pedido com ID ${orderId} não encontrado`);
    }

    const hasProducerItems = order.items.some(item => item.producerId === producer.id);
    if (!hasProducerItems) {
      throw new NotFoundException(`Pedido com ID ${orderId} não contém itens do produtor ${producer.farmName}`);
    }

    const itemsResponse: OrderItemResponseDto[] = await Promise.all(
      order.items.map(async (item) => {
        const review = await this.reviewRepository.findOne({
          where: { 
            orderItemId: item.id,
            userId: order.userId
          }
        });
        
        return {
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || 'Produto não encontrado',
          productImage: item.product?.imageUrl || '',
          quantity: item.quantity,
          unitPrice: Number(item.unitPrice) || 0,
          totalPrice: Number(item.totalPrice) || 0,
          producerId: item.producerId,
          producerName: item.producer?.farmName || item.producer?.user?.name || 'Produtor',
          notes: item.notes,
          reviewed: !!review,
        };
      })
    );

    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalPrice: Number(order.totalPrice) || 0,
      shippingAddress: order.shippingAddress,
      paymentMethod: order.paymentMethod,
      trackingCode: order.trackingCode,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: itemsResponse,
    };
  }

  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product']
    });
    
    if (!order) {
      throw new NotFoundException(`Pedido com ID ${orderId} não encontrado`);
    }

    const previousStatus = order.status;
    order.status = status;
    const updatedOrder = await this.orderRepository.save(order);
    
    return updatedOrder;
  }

  async updateOrderStatusByProducer(
    orderId: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
    producerUserId: number,
  ): Promise<Order> {
    // 1. Buscar o produtor
    const producer = await this.producerRepository.findOne({
      where: { userId: producerUserId }
    });

    if (!producer) {
      throw new NotFoundException(`Produtor com userId ${producerUserId} não encontrado`);
    }

    // 2. Buscar o pedido com relacionamentos
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // 3. Verificar se o produtor tem permissão para este pedido
    const hasPermission = order.items.some(item => item.producerId === producer.id);
    if (!hasPermission) {
      throw new ForbiddenException('Você não tem permissão para atualizar este pedido');
    }

    // 4. Salvar o status anterior
    const previousStatus = order.status;

    // 5. Converter DTO para enum da entidade
    const newStatus = this.convertDtoStatusToEntityStatus(updateOrderStatusDto.status);
    
    // 6. Atualizar o status do pedido
    order.status = newStatus;
    await this.orderRepository.save(order);

    // 7. Criar histórico de status COM orderId válido
    const statusHistory = this.statusHistoryRepository.create({
      orderId: order.id,
      status: this.convertDtoStatusToHistoryStatus(updateOrderStatusDto.status),
      previousStatus: this.convertEntityStatusToHistoryStatus(previousStatus),
      notes: updateOrderStatusDto.notes || null,
      updatedBy: producerUserId,
    });

    await this.statusHistoryRepository.save(statusHistory);

    // 8. Retornar pedido atualizado
    const updatedOrder = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items', 'items.product', 'user', 'statusHistory'],
    });

    if (!updatedOrder) {
      throw new NotFoundException('Erro ao buscar pedido atualizado');
    }

    return updatedOrder;
  }

  async notifyReadyForPickup(
    orderId: string, 
    producerUserId: number, 
    notifyDto: NotifyReadyDto
  ): Promise<{ message: string }> {
    try {
      // Buscar o pedido e verificar se pertence ao produtor
      const order = await this.orderRepository.findOne({
        where: { id: orderId },
        relations: ['items', 'items.product'],
      });

      if (!order) {
        throw new NotFoundException('Pedido não encontrado');
      }

      // Verificar se o produtor tem itens neste pedido
      const producer = await this.producerRepository.findOne({
        where: { userId: producerUserId }
      });

      if (!producer) {
        throw new NotFoundException('Produtor não encontrado');
      }

      const hasProducerItems = order.items.some(item => item.producerId === producer.id);
      
      if (!hasProducerItems) {
        throw new ForbiddenException('Você não tem permissão para atualizar este pedido');
      }

      // Verificar se o pedido está em status válido (processing ou shipped)
      if (order.status !== OrderStatus.PROCESSING && order.status !== OrderStatus.SHIPPED) {
        throw new BadRequestException('Só é possível notificar pedidos em processamento ou enviados');
      }

      // Atualizar o pedido com as informações de pronto para coleta
      await this.orderRepository.update(orderId, {
        readyForPickup: true,
        readyNotifiedAt: new Date(),
        statusNotes: notifyDto.message || 'Pedido pronto para coleta'
      });

      // Criar entrada no histórico de status
      await this.statusHistoryRepository.save({
        orderId: orderId,
        status: this.convertEntityStatusToHistoryStatus(order.status),
        previousStatus: this.convertEntityStatusToHistoryStatus(order.status),
        notes: `Notificado pronto para coleta: ${notifyDto.message || 'Sem observações'}`,
        updatedBy: producerUserId,
      });

      return {
        message: 'Cliente notificado que o pedido está pronto para coleta'
      };
    } catch (error) {
      if (error instanceof NotFoundException || 
          error instanceof ForbiddenException || 
          error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException('Erro interno do servidor');
    }
  }

  async getOrderStatusHistory(orderId: string, userId: number): Promise<OrderStatusHistory[]> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['items']
    });

    if (!order) {
      throw new NotFoundException(`Pedido não encontrado`);
    }

    const isOwner = order.userId === userId;
    
    let hasPermission = isOwner;
    if (!isOwner) {
      const producer = await this.producerRepository.findOne({
        where: { userId: userId }
      });
      
      if (producer) {
        hasPermission = order.items.some(item => item.producerId === producer.id);
      }
    }

    if (!hasPermission) {
      throw new ForbiddenException('Você não tem permissão para ver o histórico deste pedido');
    }

    const history = await this.statusHistoryRepository.find({
      where: { orderId: orderId },
      relations: ['updatedByUser'],
      order: { createdAt: 'DESC' }
    });

    return history;
  }

  private convertEntityStatusToHistoryStatus(entityStatus: OrderStatus): HistoryOrderStatus {
    const mapping = {
      [OrderStatus.PENDING]: HistoryOrderStatus.PENDING,
      [OrderStatus.PROCESSING]: HistoryOrderStatus.PROCESSING, 
      [OrderStatus.SHIPPED]: HistoryOrderStatus.SHIPPED,
      [OrderStatus.DELIVERED]: HistoryOrderStatus.DELIVERED,
      [OrderStatus.CANCELED]: HistoryOrderStatus.CANCELED,
    };
    return mapping[entityStatus];
  }

  private convertDtoStatusToEntityStatus(dtoStatus: OrderStatusDto): OrderStatus {
    const mapping = {
      [OrderStatusDto.PENDING]: OrderStatus.PENDING,
      [OrderStatusDto.PROCESSING]: OrderStatus.PROCESSING,
      [OrderStatusDto.SHIPPED]: OrderStatus.SHIPPED,
      [OrderStatusDto.DELIVERED]: OrderStatus.DELIVERED,
      [OrderStatusDto.CANCELED]: OrderStatus.CANCELED,
    };
    return mapping[dtoStatus];
  }

  private convertDtoStatusToHistoryStatus(dtoStatus: OrderStatusDto): HistoryOrderStatus {
    const mapping = {
      [OrderStatusDto.PENDING]: HistoryOrderStatus.PENDING,
      [OrderStatusDto.PROCESSING]: HistoryOrderStatus.PROCESSING,
      [OrderStatusDto.SHIPPED]: HistoryOrderStatus.SHIPPED,
      [OrderStatusDto.DELIVERED]: HistoryOrderStatus.DELIVERED,
      [OrderStatusDto.CANCELED]: HistoryOrderStatus.CANCELED,
    };
    return mapping[dtoStatus];
  }
}