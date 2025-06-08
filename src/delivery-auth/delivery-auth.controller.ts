import {
  Controller,
  Post,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { DeliveryAuthService } from './delivery-auth.service';
import { RegisterDeliveryDto } from './dto/register-delivery.dto';
import { LoginDeliveryDto } from './dto/login-delivery.dto';
import { UpdateDeliveryProfileDto } from './dto/update-delivery-profile.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('delivery-auth')
export class DeliveryAuthController {
  constructor(private readonly deliveryAuthService: DeliveryAuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDeliveryDto) {
    return this.deliveryAuthService.register(registerDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDeliveryDto) {
    return this.deliveryAuthService.login(loginDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Request() req: any) {
    return this.deliveryAuthService.getProfile(req.user.sub);
  }

  @Put('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(@Request() req: any, @Body() updateDto: UpdateDeliveryProfileDto) {
    return this.deliveryAuthService.updateProfile(req.user.sub, updateDto);
  }

  @Put('vehicle')
  @UseGuards(JwtAuthGuard)
  async updateVehicle(@Request() req: any, @Body() updateVehicleDto: UpdateVehicleDto) {
    return this.deliveryAuthService.updateVehicle(req.user.sub, updateVehicleDto);
  }
}