import { Controller, Get, Put, Post, Body, Param, UseGuards, Req, ForbiddenException } from '@nestjs/common';
import { ProducerService } from './producer.service'; // Verifique este caminho
import { CreateProducerDto } from './create-producer.dto'; // Verifique este caminho
import { CompleteProfileDto } from 'src/dto/complete-profile.dto'; // Verifique este caminho
import { ProfileStatusDto } from 'src/dto/producers/profile-status'; // Verifique este caminho
import { Producer } from 'src/entities/producer.entity'; // Verifique este caminho
// import { JwtAuthGuard } from '../auth/jwt-auth.guard'; // Descomente e ajuste o caminho se usar autenticação

@Controller('producers') // Alterado para plural, que é uma convenção comum
export class ProducerController {
  constructor(
    private readonly producerService: ProducerService, // Apenas uma injeção
  ) {}
  private getUserIdFromRequest(req: any): string { // Ou number, dependendo do tipo do ID do usuário
    const userId = req.user?.id || req.user?.sub; // Assumindo que o ID do usuário está em req.user.id ou req.user.sub
    if (!userId) {
      throw new ForbiddenException('User ID not found in authenticated user token.');
    }
    return String(userId); // Converta para string se o serviço espera string, ou mantenha number
  }

  @Post()
  async create(@Body() createProducerDto: CreateProducerDto) {
    return this.producerService.create(createProducerDto);
  }

  // @UseGuards(JwtAuthGuard) // Descomente para proteger
  @Get('profile-status')
  async getProfileStatusController(@Req() req: any): Promise<ProfileStatusDto> {
    // const userId = this.getUserIdFromRequest(req); // Para produção
    const producerIdForTesting = 'producer-123-abc'; // Para teste
    return this.producerService.getProfileStatus(producerIdForTesting /* userId */);
  }

  // @UseGuards(JwtAuthGuard) // Descomente para proteger
  @Put('complete-profile')
  async completeProfileController(
    @Req() req: any,
    @Body() completeProfileDto: CompleteProfileDto,
  ): Promise<Producer> {
    // const userId = this.getUserIdFromRequest(req); // Para produção
    const producerIdForTesting = 'producer-123-abc'; // Para teste
    return this.producerService.completeProfile(producerIdForTesting /* userId */, completeProfileDto);
  }

  @Get('profile-status/:id')
  async getProfileStatusById(@Param('id') id: string): Promise<ProfileStatusDto> {
    // Certifique-se que producerService.getProfileStatus pode lidar com este 'id'
    // (se é um userId ou um producerEntityId)
    return this.producerService.getProfileStatus(id);
  }

  @Put('complete-profile/:id')
  async completeProfileById(
    @Param('id') id: string,
    @Body() completeProfileDto: CompleteProfileDto,
  ): Promise<Producer> {
    // Certifique-se que producerService.completeProfile pode lidar com este 'id'
    return this.producerService.completeProfile(id, completeProfileDto);
  }
}


