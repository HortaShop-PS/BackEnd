import { ProductResponseDto } from '../../products/dto/product-response.dto';

export class FavoriteResponseDto {
  id: string;
  product: ProductResponseDto;
  createdAt: Date;
}