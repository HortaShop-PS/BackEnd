import { Controller, Get, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductResponseDto } from './dto/product-response.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  @Get('featured')
  async getFeatured(
    @Query('limit') limit?: number,
  ): Promise<ProductResponseDto[]> {
    const qty = limit ? Number(limit) : undefined;
    const products = await this.service.getFeatured(qty);

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      unit: p.unit,
      imageUrl: p.imageUrl,
      isNew: p.isNew,
    }));
  }
}
