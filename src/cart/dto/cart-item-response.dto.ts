export class CartItemResponseDto {
  id: number;
  cartId: number;
  productId: string;
  product: {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    unit: string;
  };
  quantity: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}