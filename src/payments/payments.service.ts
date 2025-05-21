import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { ProcessPixPaymentDto } from './dto/process-pix-payment.dto';
import { PixPaymentResponseDto } from './dto/pix-payment-response.dto';
import { ProcessCardPaymentDto } from './dto/process-card-payment.dto';
import { CardPaymentResponseDto } from './dto/card-payment-response.dto';
import { UpdatePaymentStatusDto } from './dto/update-payment-status.dto';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Card)
    private readonly cardRepository: Repository<Card>,
  ) {}

  // Processa um pagamento PIX e retorna os dados necessários
  processPixPayment(
    processPixPaymentDto: ProcessPixPaymentDto,
    userId: number, // Adicionado userId
  ): PixPaymentResponseDto {
    console.log(`Usuário ${userId} processando pagamento PIX para o pedido:`, processPixPaymentDto.orderId); // Log com userId
    // Simulação do processamento de pagamento PIX
    console.log('Processando pagamento PIX para o pedido:', processPixPaymentDto.orderId);
    const qrCodeUrl = `https://example.com/pix/qr/${Date.now()}`;
    const copyPasteCode = `00020126330014br.gov.bcb.pix0111${Date.now()}0215${processPixPaymentDto.amount.toFixed(2).replace('.', '')}5204000053039865802BR5913Mocked Company6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000); // Expira em uma hora

    return {
      qrCodeUrl,
      copyPasteCode,
      expiresAt,
    };
  }

  // Processa um pagamento com cartão e retorna o status da transação
  processCardPayment(
    processCardPaymentDto: ProcessCardPaymentDto,
    userId: number, // Adicionado userId
  ): CardPaymentResponseDto {
    console.log(`Usuário ${userId} processando pagamento com cartão para o pedido:`, processCardPaymentDto.orderId); // Log com userId
    // Simulação do processamento de pagamento com cartão
    console.log('Processando pagamento com cartão para o pedido:', processCardPaymentDto.orderId);
    const transactionId = `txn_${Date.now()}`;
    const status = 'approved'; // ou 'declined', 'pending'

    return {
      status,
      transactionId,
    };
  }

  // Atualiza o status de um pagamento existente
  updatePaymentStatus(
    updatePaymentStatusDto: UpdatePaymentStatusDto,
    userId: number, // Adicionado userId
  ): { message: string; status: string } {
    console.log(`Usuário ${userId} atualizando status do pagamento para o ID:`, updatePaymentStatusDto.paymentId); // Log com userId
    // Simulação da atualização do status do pagamento
    console.log(
      'Atualizando status do pagamento para o ID:',
      updatePaymentStatusDto.paymentId,
      'para:',
      updatePaymentStatusDto.status,
    );
    return {
      message: 'Status do pagamento atualizado com sucesso',
      status: updatePaymentStatusDto.status,
    };
  }

  // Métodos de Gerenciamento de Cartão
  async createCard(createCardDto: CreateCardDto, userId: number): Promise<Card> {
    const { number, expiry, cardType, ...restOfDto } = createCardDto;
    const [expiryMonth, expiryYear] = expiry.split('/');

    // Detecção simplificada da bandeira - considerar uma biblioteca mais robusta para produção
    let brand = 'unknown';
    if (number.startsWith('4')) {
      brand = 'visa';
    } else if (number.startsWith('5')) {
      brand = 'mastercard';
    } // Adicionar mais detecções de bandeira conforme necessário

    const card = this.cardRepository.create({
      ...restOfDto,
      last4Digits: number.slice(-4),
      brand,
      expiryMonth,
      expiryYear: `20${expiryYear}`, // Assumindo que o formato YY significa 20YY
      userId,
      cardType, // Adiciona o tipo do cartão aqui
    });
    return this.cardRepository.save(card);
  }

  // Busca todos os cartões de um usuário
  async findAllCards(userId: number): Promise<Card[]> {
    return this.cardRepository.find({ where: { userId } });
  }

  // Busca um cartão específico pelo ID
  async findCardById(id: string, userId: number): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id, userId } });
    if (!card) {
      throw new NotFoundException(`Cartão com ID "${id}" não encontrado para este usuário.`);
    }
    return card;
  }

  // Atualiza os dados de um cartão existente
  async updateCard(userId: number, cardId: string, updateCardDto: UpdateCardDto): Promise<Card> {
    const card = await this.cardRepository.findOne({ where: { id: cardId, userId } });
    if (!card) {
      throw new NotFoundException(`Cartão com ID ${cardId} não encontrado para este usuário.`);
    }

    // Desestrutura o DTO para pegar os campos relevantes
    const { number, expiry, cardholderName, cardType } = updateCardDto;

    const updatePayload: Partial<Card> = {};

    if (cardholderName) {
      updatePayload.cardholderName = cardholderName;
    }
    if (cardType) {
      updatePayload.cardType = cardType;
    }

    if (number) {
      // Lógica para atualizar last4Digits e brand se o número do cartão for fornecido
      // Esta lógica pode ser complexa e envolver a validação do novo número
      // Por simplicidade, vamos assumir que se 'number' é fornecido,
      // 'last4Digits' e 'brand' também precisam ser reavaliados ou fornecidos.
      // Para este exemplo, vamos apenas atualizar last4Digits se o número for fornecido.
      // Em um cenário real, você precisaria de uma lógica mais robusta aqui.
      updatePayload.last4Digits = number.slice(-4);
      // updatePayload.brand = this.determineCardBrand(number); // Função hipotética
    }

    if (expiry) {
      const [month, year] = expiry.split('/');
      updatePayload.expiryMonth = month;
      updatePayload.expiryYear = year; // Idealmente, armazene como '20YY'
    }

    // Mescla as atualizações no cartão existente
    Object.assign(card, updatePayload);

    return this.cardRepository.save(card);
  }

  // Remove um cartão do usuário
  async removeCard(id: string, userId: number): Promise<void> {
    const card = await this.findCardById(id, userId); // Garante que o cartão existe e pertence ao usuário
    const result = await this.cardRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(`Cartão com ID "${id}" não encontrado ou já foi deletado.`);
    }
  }
}