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
      category: p.category,
      isOrganic: p.isOrganic,
      origin: p.origin
    }));
  }

  @Get('search')
  async search(
    @Query('name') name?: string,
    @Query('minPrice') minPrice?: number,
    @Query('maxPrice') maxPrice?: number,
    @Query('isFeatured') isFeatured?: boolean,
    @Query('isNew') isNew?: boolean,
    @Query('limit') limit?: number,
    @Query('category') category?: string,
    @Query('isOrganic') isOrganic?: boolean,
    @Query('origin') origin?: string,
  ): Promise<ProductResponseDto[]> {
    const products = await this.service.advancedSearch({
      name,
      minPrice: minPrice ? Number(minPrice) : undefined,
      maxPrice: maxPrice ? Number(maxPrice) : undefined,
      isFeatured: isFeatured ? isFeatured === true : undefined,
      isNew: isNew ? isNew === true : undefined,
      limit: limit ? Number(limit) : undefined,
      category,
      isOrganic: isOrganic ? isOrganic === true : undefined
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      unit: p.unit,
      imageUrl: p.imageUrl,
      isNew: p.isNew,
      category: p.category,
      isOrganic: p.isOrganic
    }));
  }
}
