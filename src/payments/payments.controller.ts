import { Controller, Post, Body, HttpCode, HttpStatus, Get, Param, Patch, Delete, UseGuards, Request, ParseUUIDPipe, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { Card } from './entities/card.entity';
import { PaymentsService } from './payments.service';
import { ProcessPixPaymentDto } from './dto/process-pix-payment.dto';
import { PixPaymentResponseDto } from './dto/pix-payment-response.dto';
import { ProcessCardPaymentDto } from './dto/process-card-payment.dto';
import { CardPaymentResponseDto } from './dto/card-payment-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

// Controlador responsável pelas rotas relacionadas a pagamentos
@Controller('payments')
export class PaymentsController {
  // Injeta o serviço de pagamentos
  constructor(private readonly paymentsService: PaymentsService) {}

  // Endpoint para processar pagamento via Pix
  @UseGuards(AuthGuard('jwt')) // Protegendo a rota
  @Post('pix')
  @HttpCode(HttpStatus.CREATED)
  async processPixPayment(
    @Body() processPixPaymentDto: ProcessPixPaymentDto,
    @Request() req,
  ): Promise<PixPaymentResponseDto> {
    const userId = req.user.id;
    return this.paymentsService.processPixPayment(processPixPaymentDto, userId);
  }

  // Endpoint para processar pagamento via cartão
  @UseGuards(AuthGuard('jwt')) // Protegendo a rota
  @Post('card')
  @HttpCode(HttpStatus.CREATED)
  async processCardPayment(
    @Body() processCardPaymentDto: ProcessCardPaymentDto,
    @Request() req,
  ): Promise<CardPaymentResponseDto> {
    const userId = req.user.id;
    return this.paymentsService.processCardPayment(processCardPaymentDto, userId);
  }

  // Endpoint para atualizar o status de um pagamento
  @UseGuards(AuthGuard('jwt')) // Protegendo a rota
  @Post('status')
  @HttpCode(HttpStatus.OK)
  async updatePaymentStatus(
    @Body() updatePaymentStatusDto: UpdatePaymentStatusDto,
    @Request() req,
  ): Promise<{ message: string; status: string }> {
    const userId = req.user.id;
    return this.paymentsService.updatePaymentStatus(updatePaymentStatusDto, userId);
  }

  // --- Gerenciamento de Cartões ---

  // Endpoint para criar um novo cartão (protegido por autenticação JWT)
  @UseGuards(AuthGuard('jwt')) // Protegendo a rota
  @Post('cards')
  @HttpCode(HttpStatus.CREATED)
  async createCard(@Body() createCardDto: CreateCardDto, @Request() req): Promise<Card> {
    // Obtém o ID do usuário autenticado
    const userId = req.user.id; 
    return this.paymentsService.createCard(createCardDto, userId);
  }

  // Endpoint para listar todos os cartões do usuário autenticado
  @UseGuards(AuthGuard('jwt'))
  @Get('cards')
  async findAllCards(@Request() req): Promise<Card[]> {
    const userId = req.user.id;
    return this.paymentsService.findAllCards(userId);
  }

  // Endpoint para buscar um cartão específico pelo ID (do usuário autenticado)
  @UseGuards(AuthGuard('jwt'))
  @Get('cards/:id')
  async findCardById(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<Card> {
    const userId = req.user.id;
    return this.paymentsService.findCardById(id, userId);
  }

  // Endpoint para atualizar um cartão específico (do usuário autenticado)
  @UseGuards(AuthGuard('jwt'))
  @Patch('cards/:id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.OK)
  async updateCard(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCardDto: UpdateCardDto,
    @Req() req: any, // Usado para extrair o userId do usuário autenticado
  ): Promise<Card> {
    const userId = req.user.id; // Extrai o ID do usuário do token JWT
    // Corrija a ordem dos argumentos aqui:
    return this.paymentsService.updateCard(userId, id, updateCardDto);
  }

  // Endpoint para remover um cartão específico (do usuário autenticado)
  @UseGuards(AuthGuard('jwt'))
  @Delete('cards/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeCard(@Param('id', ParseUUIDPipe) id: string, @Request() req): Promise<void> {
    const userId = req.user.id;
    return this.paymentsService.removeCard(id, userId);
  }
}