import { Controller, Get, Put, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ProducerService } from './producer.service';
import { CreateProducerDto } from './create-producer.dto';
import { CompleteProfileDto } from 'src/dto/complete-profile.dto';
import { ProfileStatusDto } from 'src/dto/producers/profile-status';
import { Producer } from 'src/entities/producer.entity';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard'; // Ajuste o caminho conforme necessário

@Controller('producers')
export class ProducerController {
  constructor(
    private readonly producerService: ProducerService,
  ) {}

  private getUserIdFromRequest(req: any): number {
    const userId = req.user?.id || req.user?.sub;
    if (!userId) {
      throw new ForbiddenException('User ID not found in authenticated user token.');
    }
    return Number(userId);
  }

  @Post()
  async create(@Body() createProducerDto: CreateProducerDto) {
    return this.producerService.create(createProducerDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile-status')
  async getProfileStatusController(@Req() req: any): Promise<ProfileStatusDto> {
    const userId = this.getUserIdFromRequest(req);
    return this.producerService.getProfileStatusByUserId(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Put('complete-profile')
  async completeProfileController(
    @Req() req: any,
    @Body() completeProfileDto: CompleteProfileDto,
  ): Promise<Producer> {
    const userId = this.getUserIdFromRequest(req);
    return this.producerService.completeProfileByUserId(userId, completeProfileDto);
  }

  @Get('profile-status/:id')
  async getProfileStatusById(@Param('id') id: string): Promise<ProfileStatusDto> {
    return this.producerService.getProfileStatus(id);
  }

  @Put('complete-profile/:id')
  async completeProfileById(
    @Param('id') id: string,
    @Body() completeProfileDto: CompleteProfileDto,
  ): Promise<Producer> {
    return this.producerService.completeProfile(id, completeProfileDto);
  }
}


