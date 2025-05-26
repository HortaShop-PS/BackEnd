import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Request, 
  UseGuards, 
  ParseUUIDPipe,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { ProductResponseDto } from './dto/product-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('producers/me/products')
@UseGuards(JwtAuthGuard)
export class ProducerProductsController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createProduct(
    @Body() createProductDto: CreateProductDto,
    @Request() req
  ): Promise<ProductResponseDto> {
    return this.productService.createProductForProducer(createProductDto, req.user.id);
  }

  @Get()
  async getMyProducts(@Request() req): Promise<ProductResponseDto[]> {
    return this.productService.getProductsByProducerId(req.user.id);
  }

  @Get(':productId')
  async getProductDetails(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req
  ): Promise<ProductResponseDto> {
    return this.productService.getProductByIdForProducer(productId, req.user.id);
  }

  @Put(':productId')
  async updateProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() updateProductDto: UpdateProductDto,
    @Request() req
  ): Promise<ProductResponseDto> {
    return this.productService.updateProductForProducer(productId, updateProductDto, req.user.id);
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Request() req
  ): Promise<void> {
    await this.productService.deleteProductForProducer(productId, req.user.id);
  }
}