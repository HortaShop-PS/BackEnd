export class CheckoutResponseDto {
  id: string;
  orderId: string;
  cartId: number;
  addressId?: number;
  deliveryMethod?: string;
  couponCode?: string;
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class CalculateTotalResponseDto {
  subtotal: number;
  discount: number;
  deliveryFee: number;
  total: number;
}