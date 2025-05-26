import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Favorite } from '../entities/favorite.entity';
import { User } from '../entities/user.entity';
import { Product } from '../products/product.entity';

@Injectable()
export class FavoritesService {
  constructor(
    @InjectRepository(Favorite)
    private readonly favoritesRepository: Repository<Favorite>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Product)
    private readonly productsRepository: Repository<Product>,
  ) {}

  async addFavorite(userId: number, productId: string): Promise<Favorite> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    const product = await this.productsRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Produto com ID ${productId} não encontrado`);
    }

    const existingFavorite = await this.favoritesRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
      relations: ['user', 'product'],
    });

    if (existingFavorite) {
      throw new ConflictException('Este produto já está nos favoritos do usuário');
    }

    const favorite = this.favoritesRepository.create({
      user,
      product,
    });

    return this.favoritesRepository.save(favorite);
  }

  async removeFavorite(userId: number, productId: string): Promise<void> {
    const favorite = await this.favoritesRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
      relations: ['user', 'product'],
    });

    if (!favorite) {
      throw new NotFoundException('Favorito não encontrado');
    }

    await this.favoritesRepository.delete(favorite.id);
  }

  async getUserFavorites(userId: number): Promise<Favorite[]> {
    const user = await this.usersRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    return this.favoritesRepository.find({
      where: { user: { id: userId } },
      relations: ['product'],
    });
  }

  async checkIsFavorite(userId: number, productId: string): Promise<boolean> {
    const favorite = await this.favoritesRepository.findOne({
      where: {
        user: { id: userId },
        product: { id: productId },
      },
    });

    return !!favorite;
  }
}