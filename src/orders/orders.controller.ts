import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  UseGuards,
  Request,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrderStatus } from './entities/order.entity';
import {
  OrderDetailResponseDto,
  OrderSummaryResponseDto,
} from './dto/order-response.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createOrder(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyOrders(@Request() req): Promise<OrderSummaryResponseDto[]> {
    return this.ordersService.getOrdersByUserId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':orderId')
  async getOrderById(
    @Request() req,
    @Param('orderId') orderId: string,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.getOrderById(orderId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/status')
  async updateOrderStatus(
    @Param('orderId') orderId: string,
    @Body('status') status: OrderStatus,
  ) {
    return this.ordersService.updateOrderStatus(orderId, status);
  }
}

@Controller('producers')
export class ProducerOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/orders')
  async getProducerOrders(@Request() req): Promise<OrderSummaryResponseDto[]> {
    // Adicionar validação de usuário produtor
    return this.ordersService.getOrdersByProducerId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/orders/:orderId')
  async getProducerOrderById(
    @Request() req,
    @Param('orderId') orderId: string,
  ): Promise<OrderDetailResponseDto> {
    return this.ordersService.getProducerOrderDetails(orderId, req.user.id);
  }
}
