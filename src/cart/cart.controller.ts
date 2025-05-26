import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CartResponseDto } from './dto/cart-response.dto';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@Request() req): Promise<CartResponseDto> {
    return this.cartService.getCart(req.user.id);
  }

  @Post('items/:productId')
  addItemToCart(
    @Request() req,
    @Param('productId') productId: string,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<CartResponseDto> {
    return this.cartService.addItemToCart(req.user.id, productId, addToCartDto.quantity);
  }

  @Patch('items/:itemId')
  updateCartItemQuantity(
    @Request() req,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartResponseDto> {
    return this.cartService.updateCartItemQuantity(req.user.id, +itemId, updateCartItemDto.quantity);
  }

  @Delete('items/:itemId')
  removeCartItem(
    @Request() req,
    @Param('itemId') itemId: string,
  ): Promise<CartResponseDto> {
    return this.cartService.removeCartItem(req.user.id, +itemId);
  }

  @Delete()
  clearCart(@Request() req): Promise<CartResponseDto> {
    return this.cartService.clearCart(req.user.id);
  }
}