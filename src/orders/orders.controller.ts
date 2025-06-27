import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Put } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto, NotifyReadyDto } from './dto/update-order-status.dto';
import { OrderDetailResponseDto, OrderSummaryResponseDto } from './dto/order-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createOrderDto: CreateOrderDto, @Request() req) {
    return this.ordersService.createOrder(req.user.id, createOrderDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMyOrders(@Request() req) {
    return this.ordersService.getOrdersByUserId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':orderId')
  findOne(@Param('orderId') orderId: string, @Request() req) {
    return this.ordersService.getOrderById(orderId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':orderId/status')
  updateStatus(
    @Param('orderId') orderId: string,
    @Body() updateStatusDto: UpdateOrderStatusDto,
    @Request() req
  ) {
    return this.ordersService.updateOrderStatusByProducer(orderId, updateStatusDto, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':orderId/status-history')
  async getStatusHistory(@Param('orderId') orderId: string, @Request() req) {
    const history = await this.ordersService.getOrderStatusHistory(orderId, req.user.id);
    return history;
  }
}

@Controller('producers')
export class ProducerOrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me/orders')
  async getProducerOrders(@Request() req): Promise<OrderSummaryResponseDto[]> {
    return this.ordersService.getOrdersByProducerId(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/orders/:orderId')
  async getProducerOrderById(@Request() req, @Param('orderId') orderId: string): Promise<OrderDetailResponseDto> {
    return this.ordersService.getProducerOrderDetails(orderId, req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('me/orders/:orderId/status')
  async updateOrderStatus(
    @Request() req,
    @Param('orderId') orderId: string,
    @Body() updateStatusDto: UpdateOrderStatusDto
  ): Promise<{ message: string; order: any }> {
    const updatedOrder = await this.ordersService.updateOrderStatusByProducer(
      orderId,
      updateStatusDto,
      req.user.id
    );
    
    return {
      message: 'Status atualizado com sucesso',
      order: updatedOrder
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me/orders/:orderId/status-history')
  async getOrderStatusHistory(
    @Request() req,
    @Param('orderId') orderId: string
  ): Promise<any[]> {
    const history = await this.ordersService.getOrderStatusHistory(orderId, req.user.id);
    
    return history.map(h => ({
      id: h.id,
      status: h.status,
      previousStatus: h.previousStatus,
      notes: h.notes,
      updatedBy: h.updatedByUser?.name || 'Sistema',
      createdAt: h.createdAt
    }));
  }

  @UseGuards(JwtAuthGuard)
  @Post('me/orders/:orderId/notify-ready')
  async notifyReadyForPickup(
    @Request() req,
    @Param('orderId') orderId: string,
    @Body() notifyDto: NotifyReadyDto
  ): Promise<{ message: string }> {
    return this.ordersService.notifyReadyForPickup(orderId, req.user.id, notifyDto);
  }
}
