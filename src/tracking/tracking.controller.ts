import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { TrackingService } from './tracking.service';
import { UpdateTrackingDto } from './dto/update-tracking.dto';

@Controller('tracking')
export class TrackingController {
  constructor(private readonly trackingService: TrackingService) {}

  @Get(':orderId')
  async getTracking(@Param('orderId') orderId: string) {
    return this.trackingService.getTracking(orderId);
  }

  @Post(':orderId/update')
  async updateTracking(
    @Param('orderId') orderId: string,
    @Body() dto: UpdateTrackingDto
  ) {
    return this.trackingService.updateTracking(orderId, dto);
  }
}