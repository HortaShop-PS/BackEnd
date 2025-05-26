import { Controller, Post, Delete, Get, Param, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { FavoritesService } from './favorites.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ProductResponseDto } from '../products/dto/product-response.dto';

@Controller('favorites')
@UseGuards(JwtAuthGuard)
export class FavoritesController {
  constructor(private readonly favoritesService: FavoritesService) {}

  @Post(':productId')
  async addFavorite(
    @Request() req: { user: { userId: number } },
    @Param('productId') productId: string,
  ) {
    const userId = req.user.userId;
    await this.favoritesService.addFavorite(userId, productId);
    return { message: 'Produto adicionado aos favoritos com sucesso' };
  }

  @Delete(':productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeFavorite(
    @Request() req: { user: { userId: number } },
    @Param('productId') productId: string,
  ) {
    const userId = req.user.userId;
    await this.favoritesService.removeFavorite(userId, productId);
    return { message: 'Produto removido dos favoritos com sucesso' };
  }

  @Get()
  async getUserFavorites(
    @Request() req: { user: { userId: number } },
  ): Promise<{ products: ProductResponseDto[] }> {
    const userId = req.user.userId;
    const favorites = await this.favoritesService.getUserFavorites(userId);
    
    const products = favorites.map(favorite => ({
      id: favorite.product.id,
      name: favorite.product.name,
      price: Number(favorite.product.price),
      unit: favorite.product.unit,
      imageUrl: favorite.product.imageUrl,
      isNew: favorite.product.isNew,
      isOrganic: favorite.product.isOrganic,
      category: favorite.product.category,
      isFeatured: favorite.product.isFeatured // Add this line
    }));

    return { products };
  }

  @Get(':productId/check')
  async checkIsFavorite(
    @Request() req: { user: { userId: number } },
    @Param('productId') productId: string,
  ): Promise<{ isFavorite: boolean }> {
    const userId = req.user.userId;
    const isFavorite = await this.favoritesService.checkIsFavorite(userId, productId);
    return { isFavorite };
  }
}