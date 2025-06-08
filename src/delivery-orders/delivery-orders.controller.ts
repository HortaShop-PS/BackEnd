import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { DeliveryOrdersService } from './delivery-orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('delivery-orders')
@UseGuards(JwtAuthGuard)
export class DeliveryOrdersController {
  constructor(private readonly deliveryOrdersService: DeliveryOrdersService) {}

  @Get('available')
  async getAvailableOrders() {
    return this.deliveryOrdersService.getAvailableOrders();
  }

  @Get('me/accepted')
  async getMyAcceptedOrders(@Request() req) {
    const deliveryPersonId = req.user.id;
    return this.deliveryOrdersService.getMyAcceptedOrders(deliveryPersonId);
  }

  @Post(':orderId/accept')
  async acceptOrder(@Param('orderId') orderId: string, @Request() req) {
    const deliveryPersonId = req.user.id;
    return this.deliveryOrdersService.acceptOrder(orderId, deliveryPersonId);
  }

  @Patch(':orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: string,
    @Request() req
  ) {
    const deliveryPersonId = req.user.id;
    return this.deliveryOrdersService.updateOrderStatus(orderId, status, deliveryPersonId);
  }

  @Get(':orderId')
  async getOrderDetails(@Param('orderId') orderId: string) {
    return this.deliveryOrdersService.getOrderDetails(orderId);
  }

  @Get('me/earnings')
  async getDeliveryEarnings(
    @Request() req,
    @Query('period') period?: 'week' | 'month' | 'all'
  ) {
    const deliveryPersonId = req.user.id;
    return this.deliveryOrdersService.getDeliveryEarnings(deliveryPersonId, period);
  }

  @Get('me/history')
  async getDeliveryHistory(
    @Request() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20
  ) {
    const deliveryPersonId = req.user.id;
    return this.deliveryOrdersService.getDeliveryHistory(deliveryPersonId, page, limit);
  }
}