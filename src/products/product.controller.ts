import { Controller, Get, Query } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductResponseDto } from './dto/product-response.dto';

@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductService) {}

  /**
   * GET /products/featured?limit=6
   * Devolve os produtos que devem aparecer na tela Home.
   */
  @Get('featured')
  async getFeatured(
    @Query('limit') limit?: number,
  ): Promise<ProductResponseDto[]> {
    const qty = limit ? Number(limit) : undefined;
    const products = await this.service.getFeatured(qty);

    // mapeia para DTO (caso queira filtrar campos)
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
