import { CartItemResponseDto } from './cart-item-response.dto';

export class CartResponseDto {
  id: number;
  userId: number;
  items: CartItemResponseDto[];
  total: number;
  createdAt: Date;
  updatedAt: Date;
}