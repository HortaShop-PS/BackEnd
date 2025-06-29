import { Controller, Get, Query, Param, UseGuards, Body, Post, Request, UnauthorizedException, ParseUUIDPipe } from '@nestjs/common';
import { ProductService } from './product.service';
import { ProductResponseDto } from './dto/product-response.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly service: ProductService) { }

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
      isFeatured: p.isFeatured,
      category: p.category,
      isOrganic: p.isOrganic,
      origin: p.origin,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews
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
      isOrganic: isOrganic ? isOrganic === true : undefined,
      origin
    });

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      unit: p.unit,
      imageUrl: p.imageUrl,
      isNew: p.isNew,
      isFeatured: p.isFeatured,
      category: p.category,
      isOrganic: p.isOrganic,
      origin: p.origin,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews
    }));
  }

  @Get('all')
  async getAllProducts(): Promise<ProductResponseDto[]> {
    const products = await this.service.getAllProducts();

    return products.map((p) => ({
      id: p.id,
      name: p.name,
      price: Number(p.price),
      unit: p.unit,
      imageUrl: p.imageUrl,
      isNew: p.isNew,
      isFeatured: p.isFeatured,
      category: p.category,
      isOrganic: p.isOrganic,
      origin: p.origin,
      description: p.description,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews
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
      isFeatured: product.isFeatured,
      category: product.category,
      isOrganic: product.isOrganic,
      origin: product.origin,
      description: product.description,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews
    };
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async createProduct(@Body() createProductDto: CreateProductDto, @Request() req) {
    if (req.user.userType !== 'producer') {
      throw new UnauthorizedException('Apenas produtores podem cadastrar produtos');
    }
    return this.service.createProduct({
      ...createProductDto,
      producerId: req.user.id
    });
  }

  @Get('producer/:userId')
  @UseGuards(JwtAuthGuard)
  async getProducerProducts(
    @Param('userId') userId: string,
    @Request() req
  ): Promise<ProductResponseDto[]> {
    if (req.user.userType !== 'producer') {
      throw new UnauthorizedException('Apenas produtores podem acessar seus produtos');
    }
  
    const products = await this.service.getProductsByProducerId(Number(userId));
  
    return products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      unit: p.unit,
      imageUrl: p.imageUrl,
      isNew: p.isNew,
      isFeatured: p.isFeatured,
      category: p.category,
      isOrganic: p.isOrganic,
      origin: p.origin,
      averageRating: p.averageRating,
      totalReviews: p.totalReviews
    }));
  }
}
