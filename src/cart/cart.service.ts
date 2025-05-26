import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from '../entities/cart.entity';
import { CartItem } from '../entities/cart-item.entity';
import { Product } from '../products/product.entity';
import { User } from '../entities/user.entity';
import { CartResponseDto } from './dto/cart-response.dto';
import { CartItemResponseDto } from './dto/cart-item-response.dto';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private mapToCartResponseDto(cart: Cart): CartResponseDto {
    return {
      id: cart.id,
      userId: cart.userId,
      items: cart.items?.map(item => this.mapToCartItemResponseDto(item)) || [],
      total: Number(cart.total),
      createdAt: cart.createdAt,
      updatedAt: cart.updatedAt,
    };
  }

  private mapToCartItemResponseDto(item: CartItem): CartItemResponseDto {
    return {
      id: item.id,
      cartId: item.cartId,
      productId: item.productId,
      product: {
        id: item.product.id,
        name: item.product.name,
        price: Number(item.product.price),
        imageUrl: item.product.imageUrl,
        unit: item.product.unit,
      },
      quantity: item.quantity,
      price: Number(item.price),
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }

  async getCart(userId: number): Promise<CartResponseDto> {
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      // Criar um novo carrinho se não existir
      cart = await this.createCart(userId);
    }

    return this.mapToCartResponseDto(cart);
  }

  private async createCart(userId: number): Promise<Cart> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException(`Usuário com ID ${userId} não encontrado`);
    }

    const newCart = this.cartRepository.create({
      userId,
      user,
      items: [],
      total: 0,
    });

    return this.cartRepository.save(newCart);
  }

  async addItemToCart(userId: number, productId: string, quantity: number): Promise<CartResponseDto> {
    // Verificar se o produto existe
    const product = await this.productRepository.findOne({ where: { id: productId } });
    if (!product) {
      throw new NotFoundException(`Produto com ID ${productId} não encontrado`);
    }

    // Obter ou criar o carrinho
    let cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      cart = await this.createCart(userId);
    }

    // Verificar se o item já existe no carrinho
    let cartItem = cart.items?.find(item => item.productId === productId);

    if (cartItem) {
      // Atualizar quantidade se o item já existe
      cartItem.quantity += quantity;
      cartItem.price = Number(product.price) * cartItem.quantity;
      await this.cartItemRepository.save(cartItem);
    } else {
      // Criar novo item se não existir
      cartItem = this.cartItemRepository.create({
        cartId: cart.id,
        cart,
        productId,
        product,
        quantity,
        price: Number(product.price) * quantity,
      });
      await this.cartItemRepository.save(cartItem);

      // Adicionar o item à lista de itens do carrinho
      if (!cart.items) {
        cart.items = [];
      }
      cart.items.push(cartItem);
    }

    // Recalcular o total do carrinho
    cart.total = cart.items.reduce((sum, item) => sum + Number(item.price), 0);
    await this.cartRepository.save(cart);

    // Buscar o carrinho atualizado com todas as relações
    return this.getCart(userId);
  }

  async updateCartItemQuantity(userId: number, itemId: number, quantity: number): Promise<CartResponseDto> {
    // Verificar se o carrinho existe
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Carrinho para o usuário com ID ${userId} não encontrado`);
    }

    // Verificar se o item existe no carrinho
    const cartItem = cart.items.find(item => item.id === itemId);
    if (!cartItem) {
      throw new NotFoundException(`Item com ID ${itemId} não encontrado no carrinho`);
    }

    if (quantity <= 0) {
      // Remover o item se a quantidade for zero ou negativa
      return this.removeCartItem(userId, itemId);
    }

    // Atualizar a quantidade e o preço
    cartItem.quantity = quantity;
    cartItem.price = Number(cartItem.product.price) * quantity;
    await this.cartItemRepository.save(cartItem);

    // Recalcular o total do carrinho
    cart.total = cart.items.reduce((sum, item) => sum + Number(item.price), 0);
    await this.cartRepository.save(cart);

    return this.getCart(userId);
  }

  async removeCartItem(userId: number, itemId: number): Promise<CartResponseDto> {
    // Verificar se o carrinho existe
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items', 'items.product'],
    });

    if (!cart) {
      throw new NotFoundException(`Carrinho para o usuário com ID ${userId} não encontrado`);
    }

    // Verificar se o item existe no carrinho
    const itemIndex = cart.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      throw new NotFoundException(`Item com ID ${itemId} não encontrado no carrinho`);
    }

    // Remover o item do banco de dados
    await this.cartItemRepository.delete(itemId);

    // Remover o item da lista de itens do carrinho
    cart.items.splice(itemIndex, 1);

    // Recalcular o total do carrinho
    cart.total = cart.items.reduce((sum, item) => sum + Number(item.price), 0);
    await this.cartRepository.save(cart);

    return this.getCart(userId);
  }

  async clearCart(userId: number): Promise<CartResponseDto> {
    // Verificar se o carrinho existe
    const cart = await this.cartRepository.findOne({
      where: { userId },
      relations: ['items'],
    });

    if (!cart) {
      throw new NotFoundException(`Carrinho para o usuário com ID ${userId} não encontrado`);
    }

    // Remover todos os itens do carrinho
    await this.cartItemRepository.delete({ cartId: cart.id });

    // Atualizar o carrinho
    cart.items = [];
    cart.total = 0;
    await this.cartRepository.save(cart);

    return this.mapToCartResponseDto(cart);
  }
}