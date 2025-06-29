import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tracking } from './entities/tracking.entity';
import { UpdateTrackingDto } from './dto/update-tracking.dto';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Tracking)
    private trackingRepository: Repository<Tracking>,
  ) {}

  async getTracking(orderId: string) {
    const timeline = await this.trackingRepository.find({
      where: { orderId },
      order: { createdAt: 'ASC' }
    });
    
    const current = timeline[timeline.length - 1];
    
    return {
      currentStatus: current?.status || 'pending',
      timeline,
      estimatedTime: this.calculateEstimatedTime(current?.status || 'pending'),
      location: current ? { latitude: current.latitude, longitude: current.longitude } : undefined,
    };
  }

  async updateTracking(orderId: string, dto: UpdateTrackingDto) {
    const tracking = this.trackingRepository.create({ 
      orderId, 
      latitude: dto.latitude,
      longitude: dto.longitude,
      status: dto.status
    });
    
    return await this.trackingRepository.save(tracking);
  }

  private calculateEstimatedTime(status: string): string {
    switch (status) {
      case 'pending': return '2-3 horas para confirmação';
      case 'processing': return '24-48 horas para preparo';
      case 'shipped': return '1-3 dias para entrega';
      case 'delivered': return 'Entregue';
      default: return 'Em breve';
    }
  }
}