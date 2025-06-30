import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { Product } from '../products/product.entity';
import { User } from '../entities/user.entity';
import { Producer } from '../entities/producer.entity';
import { Review } from '../reviews/entities/review.entity';
import { OrderDetailResponseDto, OrderItemResponseDto, OrderSummaryResponseDto } from './dto/order-response.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../dto/notification.dto';

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
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
    private readonly eventEmitter: EventEmitter2,
    private readonly notificationsService: NotificationsService,
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
        reviewed: false, // This will be determined in OrderDetail, not needed for summary
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
            userId: userId // Ensure review belongs to the user viewing the order
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

    // Ensure at least one item in the order belongs to this producer
    const hasProducerItems = order.items.some(item => item.producerId === producer.id);
    if (!hasProducerItems) {
      throw new NotFoundException(`Pedido com ID ${orderId} não contém itens do produtor ${producer.farmName}`);
    }

    const itemsResponse: OrderItemResponseDto[] = order.items
      .filter(item => item.producerId === producer.id)
      .map(item => ({
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
      }));

    return {
      id: order.id,
      userId: order.userId,
      status: order.status,
      totalPrice: itemsResponse.reduce((sum, item) => sum + item.totalPrice, 0),
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
      relations: ['items', 'items.product', 'user']
    });
    
    if (!order) {
      throw new NotFoundException(`Pedido com ID ${orderId} não encontrado`);
    }

    const previousStatus = order.status;
    order.status = status;
    const updatedOrder = await this.orderRepository.save(order);

    // Se o pedido foi marcado como saiu para entrega (SHIPPED), enviar notificação push
    if (status === OrderStatus.SHIPPED && previousStatus !== OrderStatus.SHIPPED) {
      try {
        // Criar notificação no banco de dados
        await this.notificationsService.createNotification({
          title: 'Pedido saiu para entrega! 🚚',
          body: `Seu pedido #${orderId.substring(0, 8)} saiu para entrega e está a caminho. Acompanhe o status na aba de pedidos.`,
          userId: order.userId,
          type: NotificationType.ORDER_SHIPPED,
          data: {
            orderId: order.id,
            trackingCode: order.trackingCode || `HRT${orderId.substring(0, 6).toUpperCase()}`,
            status: 'shipped'
          }
        });

        // Enviar notificação push via FCM
        await this.notificationsService.sendPushToUser(order.userId, {
          title: 'Pedido saiu para entrega! 🚚',
          body: `Seu pedido #${orderId.substring(0, 8)} saiu para entrega e está a caminho.`,
          data: {
            type: 'order_shipped',
            orderId: order.id,
            trackingCode: order.trackingCode || `HRT${orderId.substring(0, 6).toUpperCase()}`,
            status: 'shipped'
          }
        });

        console.log(`✅ Notificação de SHIPPED enviada para usuário ${order.userId} - Pedido ${orderId}`);
      } catch (error) {
        console.error(`❌ Erro ao enviar notificação SHIPPED para pedido ${orderId}:`, error);
        // Continua a execução mesmo se a notificação falhar
      }
    }

    // Se o pedido foi marcado como entregue, emitir evento para notificar sobre avaliações
    if (status === OrderStatus.DELIVERED && previousStatus !== OrderStatus.DELIVERED) {
      try {
        // 🗑️ PRIMEIRO: Excluir notificações de "shipped" do banco de dados
        await this.notificationsService.deleteNotificationsByOrderAndType(
          order.id, 
          NotificationType.ORDER_SHIPPED
        );
        console.log(`🗑️ Notificações de SHIPPED excluídas para o pedido ${orderId}`);

        // Criar notificação no banco de dados
        await this.notificationsService.createNotification({
          title: 'Pedido entregue! ✅',
          body: `Seu pedido #${orderId.substring(0, 8)} foi entregue com sucesso. Que tal avaliar os produtos?`,
          userId: order.userId,
          type: NotificationType.ORDER_DELIVERED,
          data: {
            orderId: order.id,
            status: 'delivered'
          }
        });

        // Enviar notificação push via FCM
        await this.notificationsService.sendPushToUser(order.userId, {
          title: 'Pedido entregue! ✅',
          body: `Seu pedido #${orderId.substring(0, 8)} foi entregue com sucesso.`,
          data: {
            type: 'order_delivered',
            orderId: order.id,
            status: 'delivered'
          }
        });

        console.log(`✅ Notificação de DELIVERED enviada para usuário ${order.userId} - Pedido ${orderId}`);
      } catch (error) {
        console.error(`❌ Erro ao processar notificações para pedido ${orderId}:`, error);
      }

      // Emitir evento para sistema de avaliações
      this.eventEmitter.emit('order.delivered', {
        orderId: order.id,
        userId: order.userId,
        items: order.items.map(item => ({
          id: item.id,
          productId: item.productId,
          productName: item.product?.name || 'Produto não encontrado'
        }))
      });
    }
    
    return updatedOrder;
  }
}