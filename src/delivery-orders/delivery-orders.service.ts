import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Order, OrderStatus } from '../orders/entities/order.entity';
import { Checkout } from '../checkout/entities/checkout.entity';
import { DeliveryOrderResponseDto } from './dto/order-response.dto';

@Injectable()
export class DeliveryOrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Checkout)
    private checkoutRepository: Repository<Checkout>,
  ) {}

  async getAvailableOrders(): Promise<DeliveryOrderResponseDto[]> {
    const orders = await this.orderRepository.find({
      where: { 
        status: OrderStatus.PROCESSING 
      },
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });

    return orders.map(order => this.mapOrderToResponse(order));
  }

  async getOrderDetails(orderId: string): Promise<DeliveryOrderResponseDto> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    return this.mapOrderToResponse(order);
  }

  private mapOrderToResponse(order: Order): DeliveryOrderResponseDto {
    return {
      id: order.id,
      userId: order.userId,
      customerName: order.user?.name || 'Cliente não identificado',
      customerPhone: order.user?.phone || '',
      status: order.status,
      totalPrice: Number(order.totalPrice),
      shippingAddress: order.shippingAddress || '',
      paymentMethod: order.paymentMethod || '',
      trackingCode: order.trackingCode || '',
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items?.map(item => ({
        id: item.id,
        productName: item.product?.name || 'Produto não identificado',
        quantity: item.quantity,
        price: Number(item.unitPrice),
        subtotal: Number(item.totalPrice),
      })) || [],
    };
  }

  async getDeliveryEarnings(deliveryPersonId: number, period?: 'week' | 'month' | 'all') {
    let startDate: Date;
    const now = new Date();

    // Definir período baseado no parâmetro
    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); // 1 ano
        break;
    }

    // Por enquanto, vamos simular os ganhos com base nos pedidos entregues
    // Em um cenário real, haveria uma tabela de entregas associadas ao entregador
    const orders = await this.orderRepository.find({
      where: {
        status: OrderStatus.DELIVERED,
        updatedAt: Between(startDate, now),
      },
      relations: ['user'],
      order: { updatedAt: 'DESC' },
    });

    // Buscar informações de checkout para obter deliveryFee
    const dailyEarnings = new Map<string, {
      date: string;
      totalEarnings: number;
      deliveryCount: number;
      deliveries: any[];
    }>();

    let totalEarnings = 0;
    let totalDeliveries = 0;

    for (const order of orders) {
      // Buscar checkout relacionado ao pedido
      const checkout = await this.checkoutRepository.findOne({
        where: { orderId: order.id }
      });

      if (!checkout || !checkout.deliveryFee) continue;

      const deliveryFee = Number(checkout.deliveryFee);
      const deliveryDate = order.updatedAt.toISOString().split('T')[0];

      // Simular dados da entrega
      const delivery = {
        id: `delivery-${order.id}`,
        orderId: order.id,
        customerName: order.user?.name || 'Cliente não identificado',
        deliveryFee: deliveryFee,
        distance: Math.round((deliveryFee - 8.5) / 1.5 * 10) / 10, // Estimativa baseada na taxa
        completedAt: order.updatedAt.toISOString(),
        address: order.shippingAddress || 'Endereço não informado',
      };

      // Agrupar por dia
      if (!dailyEarnings.has(deliveryDate)) {
        dailyEarnings.set(deliveryDate, {
          date: deliveryDate,
          totalEarnings: 0,
          deliveryCount: 0,
          deliveries: []
        });
      }

      const dayData = dailyEarnings.get(deliveryDate)!;
      dayData.totalEarnings += deliveryFee;
      dayData.deliveryCount += 1;
      dayData.deliveries.push(delivery);

      totalEarnings += deliveryFee;
      totalDeliveries += 1;
    }

    // Converter Map para array
    const daily = Array.from(dailyEarnings.values()).sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    // Calcular ganhos do mês atual
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const currentMonthEarnings = daily
      .filter(day => new Date(day.date) >= currentMonthStart)
      .reduce((sum, day) => sum + day.totalEarnings, 0);

    const stats = {
      totalEarnings: Number(totalEarnings.toFixed(2)),
      totalDeliveries,
      averageEarningsPerDelivery: totalDeliveries > 0 ? Number((totalEarnings / totalDeliveries).toFixed(2)) : 0,
      currentMonthEarnings: Number(currentMonthEarnings.toFixed(2)),
    };

    return { daily, stats };
  }

  async getDeliveryHistory(deliveryPersonId: number, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    // Por enquanto, simulamos que todas as entregas entregues foram feitas por este entregador
    // Em produção, haveria uma tabela específica para associar entregadores aos pedidos
    const [orders, total] = await this.orderRepository.findAndCount({
      where: {
        status: OrderStatus.DELIVERED,
      },
      relations: ['user', 'items', 'items.product'],
      order: { updatedAt: 'DESC' },
      skip,
      take: limit,
    });

    const deliveries: any[] = [];

    for (const order of orders) {
      // Buscar checkout relacionado ao pedido para obter deliveryFee
      const checkout = await this.checkoutRepository.findOne({
        where: { orderId: order.id }
      });

      const deliveryFee = checkout?.deliveryFee ? Number(checkout.deliveryFee) : 8.50;

      deliveries.push({
        id: order.id,
        orderId: order.id,
        trackingCode: order.trackingCode || `HRT${order.id.substring(0, 6).toUpperCase()}`,
        customerName: order.user?.name || 'Cliente não identificado',
        customerPhone: order.user?.phone || '',
        shippingAddress: order.shippingAddress || 'Endereço não informado',
        totalPrice: Number(order.totalPrice),
        deliveryFee,
        distance: Math.round((deliveryFee - 8.5) / 1.5 * 10) / 10, // Estimativa baseada na taxa
        completedAt: order.updatedAt,
        createdAt: order.createdAt,
        items: order.items?.map(item => ({
          id: item.id,
          name: item.product?.name || 'Produto não identificado',
          quantity: item.quantity,
          price: Number(item.unitPrice),
          image: item.product?.imageUrl || null,
        })) || [],
        specialInstructions: '', // Poderia vir de um campo adicional
      });
    }

    return {
      deliveries,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      }
    };
  }

  async getMyAcceptedOrders(deliveryPersonId: number): Promise<DeliveryOrderResponseDto[]> {
    // Por enquanto, simulamos que o entregador não tem sistema de aceitação
    // Retornamos pedidos com status 'shipped' como se fossem aceitos por ele
    const orders = await this.orderRepository.find({
      where: { 
        status: OrderStatus.SHIPPED 
      },
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
    });

    return orders.map(order => this.mapOrderToResponse(order));
  }

  async acceptOrder(orderId: string, deliveryPersonId: number): Promise<{ success: boolean; message: string }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user', 'items', 'items.product'],
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    if (order.status !== OrderStatus.PROCESSING) {
      return { 
        success: false, 
        message: 'Este pedido não está disponível para aceitar' 
      };
    }

    // Atualizar status para 'shipped' quando aceito pelo entregador
    order.status = OrderStatus.SHIPPED;
    await this.orderRepository.save(order);

    return { 
      success: true, 
      message: 'Pedido aceito com sucesso' 
    };
  }

  async updateOrderStatus(orderId: string, status: string, deliveryPersonId: number): Promise<{ success: boolean; message: string }> {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Pedido não encontrado');
    }

    // Mapear status do frontend para enum do backend
    let orderStatus: OrderStatus;
    switch (status) {
      case 'shipped':
        orderStatus = OrderStatus.SHIPPED;
        break;
      case 'delivered':
        orderStatus = OrderStatus.DELIVERED;
        break;
      default:
        return { 
          success: false, 
          message: 'Status inválido' 
        };
    }

    order.status = orderStatus;
    await this.orderRepository.save(order);

    return { 
      success: true, 
      message: 'Status atualizado com sucesso' 
    };
  }
}