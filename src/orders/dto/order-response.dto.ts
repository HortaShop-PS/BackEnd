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
}

export class OrderSummaryResponseDto {
  id: string;
  status: OrderStatus;
  totalPrice: number;
  createdAt: Date;
  updatedAt: Date;
  itemCount: number;
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