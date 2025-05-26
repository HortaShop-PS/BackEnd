import { Controller, Post, Put, Body, HttpCode, HttpStatus, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CheckoutService } from './checkout.service';
import { InitiateCheckoutDto } from './dto/initiate-checkout.dto';
import { CalculateTotalDto } from './dto/calculate-total.dto';
import { UpdateAddressDeliveryDto } from './dto/update-address-delivery.dto';
import { CheckoutResponseDto, CalculateTotalResponseDto } from './dto/checkout-response.dto';

@Controller('checkout')
@UseGuards(AuthGuard('jwt'))
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Post('initiate')
  @HttpCode(HttpStatus.CREATED)
  async initiateCheckout(
    @Body() initiateCheckoutDto: InitiateCheckoutDto,
    @Request() req
  ): Promise<CheckoutResponseDto> {
    const userId = req.user.id;
    return this.checkoutService.initiateCheckout(userId, initiateCheckoutDto);
  }

  @Post('calculate-total')
  @HttpCode(HttpStatus.OK)
  async calculateTotal(
    @Body() calculateTotalDto: CalculateTotalDto,
    @Request() req
  ): Promise<CalculateTotalResponseDto> {
    const userId = req.user.id;
    return this.checkoutService.calculateTotal(userId, calculateTotalDto);
  }

  @Put('address-delivery')
  @HttpCode(HttpStatus.OK)
  async updateAddressAndDelivery(
    @Body() updateAddressDeliveryDto: UpdateAddressDeliveryDto,
    @Request() req
  ): Promise<CheckoutResponseDto> {
    const userId = req.user.id;
    return this.checkoutService.updateAddressAndDelivery(userId, updateAddressDeliveryDto);
  }
}