import { OrderStatus } from '../entities/order.entity';

export class OrderItemResponseDto {
  id: string;
  productId: string;
  productName: string;
  productImage: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  producerId: number;
  producerName: string;
  notes?: string;
  reviewed?: boolean;
}

export class OrderSummaryResponseDto {
  id: string;
  status: string;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
  readyForPickup?: boolean; // ← ADICIONAR ESTA PROPRIEDADE
}

export class OrderDetailResponseDto {
  id: string;
  userId: number;
  status: OrderStatus;
  totalPrice: number;
  shippingAddress: string;
  paymentMethod: string;
  trackingCode?: string;
  createdAt: Date;
  updatedAt: Date;
  items: OrderItemResponseDto[];
}
