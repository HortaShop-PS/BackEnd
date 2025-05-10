import { Controller, Get, Query, Param } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { ParseUUIDPipe } from '@nestjs/common';

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

  @Get(':id')
  async getProductById(@Param('id', ParseUUIDPipe) id: string): Promise<ProductResponseDto> {
    const product = await this.service.findById(id);
    
    return {
      id: product.id,
      name: product.name,
      price: Number(product.price),
      unit: product.unit,
      imageUrl: product.imageUrl,
      isNew: product.isNew,
    };
  }
}
