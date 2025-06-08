export class DeliveryOrderResponseDto {
  id: string;
  userId: number;
  customerName: string;
  customerPhone: string;
  status: string;
  totalPrice: number;
  shippingAddress: string;
  paymentMethod: string;
  trackingCode: string;
  createdAt: Date;
  updatedAt: Date;
  items: {
    id: string;
    productName: string;
    quantity: number;
    price: number;
    subtotal: number;
  }[];
}