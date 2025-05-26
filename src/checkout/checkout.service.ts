import { Injectable, NotFoundException, BadRequestException, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Checkout, DeliveryMethod } from './entities/checkout.entity';
import { InitiateCheckoutDto } from './dto/initiate-checkout.dto';
import { CalculateTotalDto } from './dto/calculate-total.dto';
import { UpdateAddressDeliveryDto } from './dto/update-address-delivery.dto';
import { CheckoutResponseDto, CalculateTotalResponseDto } from './dto/checkout-response.dto';
import { CartService } from '../cart/cart.service';
import { OrdersService } from '../orders/orders.service';
import { Cart } from '../entities/cart.entity';
import { OrderStatus } from '../orders/entities/order.entity';

@Injectable()
export class CheckoutService {
  constructor(
    @InjectRepository(Checkout)
    private readonly checkoutRepository: Repository<Checkout>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
    @Inject(forwardRef(() => OrdersService))
    private readonly ordersService: OrdersService,
  ) {}

  async initiateCheckout(userId: number, initiateCheckoutDto: InitiateCheckoutDto): Promise<CheckoutResponseDto> {
    const { cartId } = initiateCheckoutDto;

    // Verificar se o carrinho existe e pertence ao usuário
    const cart = await this.cartRepository.findOne({
      where: { id: cartId, userId },
      relations: ['items', 'items.product']
    });

    if (!cart) {
      throw new NotFoundException(`Carrinho com ID ${cartId} não encontrado para este usuário`);
    }

    if (!cart.items || cart.items.length === 0) {
      throw new BadRequestException('Carrinho está vazio');
    }

    // Criar ordem temporária
    const createOrderDto = {
      items: cart.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      status: OrderStatus.PENDING,
      shippingAddress: 'Endereço temporário',
      paymentMethod: 'Método temporário'
    };

    const order = await this.ordersService.createOrder(userId, createOrderDto);

    // Calcular subtotal
    const subtotal = cart.items.reduce((sum, item) => sum + Number(item.price), 0);

    // Criar checkout
    const checkout = this.checkoutRepository.create({
      userId,
      cartId,
      orderId: order.id,
      subtotal,
      total: subtotal,
      status: 'initiated'
    });

    const savedCheckout = await this.checkoutRepository.save(checkout);
    return this.mapToCheckoutResponseDto(savedCheckout);
  }

  async calculateTotal(userId: number, calculateTotalDto: CalculateTotalDto): Promise<CalculateTotalResponseDto> {
    const { orderId, addressId, deliveryMethod, couponCode } = calculateTotalDto;

    // Verificar se o checkout existe e pertence ao usuário
    const checkout = await this.checkoutRepository.findOne({
      where: { orderId, userId }
    });

    if (!checkout) {
      throw new NotFoundException(`Checkout para o pedido ${orderId} não encontrado`);
    }

    let subtotal = Number(checkout.subtotal);
    let discount = 0;
    let deliveryFee = 0;

    // Aplicar desconto do cupom (simulação)
    if (couponCode) {
      discount = this.calculateCouponDiscount(couponCode, subtotal);
    }

    // Calcular taxa de entrega
    if (deliveryMethod === DeliveryMethod.DELIVERY) {
      deliveryFee = this.calculateDeliveryFee(addressId);
    }

    const total = subtotal - discount + deliveryFee;

    return {
      subtotal,
      discount,
      deliveryFee,
      total
    };
  }

  async updateAddressAndDelivery(userId: number, updateDto: UpdateAddressDeliveryDto): Promise<CheckoutResponseDto> {
    const { orderId, addressId, deliveryMethod } = updateDto;

    // Verificar se o checkout existe e pertence ao usuário
    const checkout = await this.checkoutRepository.findOne({
      where: { orderId, userId }
    });

    if (!checkout) {
      throw new NotFoundException(`Checkout para o pedido ${orderId} não encontrado`);
    }

    // Recalcular totais
    const subtotal = Number(checkout.subtotal);
    let discount = Number(checkout.discount);
    let deliveryFee = 0;

    if (deliveryMethod === DeliveryMethod.DELIVERY) {
      deliveryFee = this.calculateDeliveryFee(addressId);
    }

    const total = subtotal - discount + deliveryFee;

    // Atualizar checkout
    checkout.addressId = addressId;
    checkout.deliveryMethod = deliveryMethod;
    checkout.deliveryFee = deliveryFee;
    checkout.total = total;

    const updatedCheckout = await this.checkoutRepository.save(checkout);
    return this.mapToCheckoutResponseDto(updatedCheckout);
  }

  private calculateCouponDiscount(couponCode: string, subtotal: number): number {
    // Simulação de desconto por cupom
    const discountMap: { [key: string]: number } = {
      'DESCONTO10': 0.10,
      'DESCONTO20': 0.20,
      'FRETEGRATIS': 0.05
    };

    const discountPercentage = discountMap[couponCode] || 0;
    return subtotal * discountPercentage;
  }

  private calculateDeliveryFee(addressId: number): number {
    // Simulação de cálculo de taxa de entrega baseada no endereço
    // Em um cenário real, você consultaria uma API de frete ou uma tabela de CEPs
    const baseFee = 8.50;
    const distanceFactor = Math.random() * 5; // Simulação de distância
    return baseFee + distanceFactor;
  }

  private mapToCheckoutResponseDto(checkout: Checkout): CheckoutResponseDto {
    return {
      id: checkout.id,
      orderId: checkout.orderId,
      cartId: checkout.cartId,
      addressId: checkout.addressId,
      deliveryMethod: checkout.deliveryMethod,
      couponCode: checkout.couponCode,
      subtotal: Number(checkout.subtotal),
      discount: Number(checkout.discount),
      deliveryFee: Number(checkout.deliveryFee),
      total: Number(checkout.total),
      status: checkout.status,
      createdAt: checkout.createdAt,
      updatedAt: checkout.updatedAt
    };
  }
}