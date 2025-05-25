import {
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Card } from './entities/card.entity';
import { CartService } from '../cart/cart.service'; // Importar CartService
import { ProductService } from '../products/product.service'; // Importar ProductService
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
    @Inject(forwardRef(() => CartService))
    private readonly cartService: CartService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService, // Adicionar ProductService se necessário para estoque
  ) {}

  // Processa um pagamento PIX e retorna os dados necessários
  async processPixPayment(
    processPixPaymentDto: ProcessPixPaymentDto,
    userId: number, // Adicionado userId
  ): Promise<PixPaymentResponseDto> {
    console.log(
      `Usuário ${userId} processando pagamento PIX para o pedido:`,
      processPixPaymentDto.orderId,
    ); // Log com userId
    // Simulação do processamento de pagamento PIX
    console.log(
      'Processando pagamento PIX para o pedido:',
      processPixPaymentDto.orderId,
    );
    const qrCodeUrl = `https://example.com/pix/qr/${Date.now()}`;
    const copyPasteCode = `00020126330014br.gov.bcb.pix0111${Date.now()}0215${processPixPaymentDto.amount.toFixed(2).replace('.', '')}5204000053039865802BR5913Mocked Company6009SAO PAULO62070503***6304${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const expiresAt = new Date(Date.now() + 3600 * 1000); // Expira em uma hora

    // Após o pagamento PIX bem-sucedido (simulado)
    await this.cartService.clearCart(userId);
    // Aqui você adicionaria a lógica para atualizar o estoque de produtos, se necessário
    await this.productService.decreaseStock(
      String(processPixPaymentDto.orderId),
    );

    return {
      qrCodeUrl,
      copyPasteCode,
      expiresAt,
    };
  }

  // Processa um pagamento com cartão e retorna o status da transação
  async processCardPayment(
    processCardPaymentDto: ProcessCardPaymentDto,
    userId: number, // Adicionado userId
  ): Promise<CardPaymentResponseDto> {
    console.log(
      `Usuário ${userId} processando pagamento com cartão para o pedido:`,
      processCardPaymentDto.orderId,
    ); // Log com userId
    // Simulação do processamento de pagamento com cartão
    console.log(
      'Processando pagamento com cartão para o pedido:',
      processCardPaymentDto.orderId,
    );
    const transactionId = `txn_${Date.now()}`;
    const status = 'approved'; // ou 'declined', 'pending'

    // Após o pagamento com cartão bem-sucedido (simulado)
    if (status === 'approved') {
      await this.cartService.clearCart(userId);
      // Aqui você adicionaria a lógica para atualizar o estoque de produtos, se necessário
      await this.productService.decreaseStock(
        String(processCardPaymentDto.orderId),
      );
    }

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
    console.log(
      `Usuário ${userId} atualizando status do pagamento para o ID:`,
      updatePaymentStatusDto.paymentId,
    ); // Log com userId
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
  async createCard(
    createCardDto: CreateCardDto,
    userId: number,
  ): Promise<Card> {
    const {
      number,
      expiry,
      brand: brandFromDto,
      cardholderName,
      nickname,
      paymentMethodType,
      ...restOfDto
    } = createCardDto;
    const [expiryMonth, expiryYear] = expiry.split('/');

    // Detecção simplificada da bandeira se não vier do DTO, ou usa o do DTO
    let detectedBrand = brandFromDto;
    if (!detectedBrand) {
      if (number.startsWith('4')) {
        detectedBrand = 'visa';
      } else if (number.startsWith('5')) {
        detectedBrand = 'mastercard';
      } else {
        detectedBrand = 'unknown';
      }
    }

    const card = this.cardRepository.create({
      ...restOfDto,
      cardholderName,
      last4Digits: number.slice(-4),
      brand: detectedBrand, // Usa a bandeira detectada ou fornecida
      expiryMonth,
      expiryYear: `20${expiryYear}`,
      userId,
      nickname, // Adicionado nickname
      paymentMethodType: paymentMethodType || 'credit', // Adicionado paymentMethodType, default para 'credit' se não fornecido
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
      throw new NotFoundException(
        `Cartão com ID "${id}" não encontrado para este usuário.`,
      );
    }
    return card;
  }

  // Atualiza os dados de um cartão existente
  async updateCard(
    userId: number,
    cardId: string,
    updateCardDto: UpdateCardDto,
  ): Promise<Card> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId, userId },
    });
    if (!card) {
      throw new NotFoundException(
        `Cartão com ID ${cardId} não encontrado para este usuário.`,
      );
    }

    const {
      number,
      expiry,
      cardholderName,
      brand,
      isPrincipal,
      nickname,
      paymentMethodType,
    } = updateCardDto;

    const updatePayload: Partial<Card> = {};

    if (cardholderName) {
      updatePayload.cardholderName = cardholderName;
    }
    if (brand) {
      updatePayload.brand = brand; // Bandeira do cartão
    }
    if (nickname !== undefined) {
      // Permite limpar o nickname passando null ou string vazia se desejado, ou atualizar
      updatePayload.nickname = nickname;
    }
    if (paymentMethodType) {
      updatePayload.paymentMethodType = paymentMethodType; // 'credit' ou 'debit'
    }
    // Adicionar lógica para isPrincipal aqui
    if (isPrincipal !== undefined) {
      if (isPrincipal) {
        // Desmarca todos os outros cartões do usuário
        await this.cardRepository.update(
          { userId, isPrincipal: true },
          { isPrincipal: false },
        );
        updatePayload.isPrincipal = true;
      } else {
        updatePayload.isPrincipal = false;
      }
    }

    if (number) {
      updatePayload.last4Digits = number.slice(-4);
      // Se o número do cartão for atualizado, a bandeira também pode precisar ser atualizada
      // let detectedBrand = brand; // Usa a marca do DTO se fornecida
      // if (!detectedBrand) { // Se não, tenta detectar
      //   if (number.startsWith('4')) detectedBrand = 'visa';
      //   else if (number.startsWith('5')) detectedBrand = 'mastercard';
      //   else detectedBrand = 'unknown';
      // }
      // updatePayload.brand = detectedBrand;
    }

    if (expiry) {
      const [month, year] = expiry.split('/');
      updatePayload.expiryMonth = month;
      updatePayload.expiryYear = `20${year}`; // Idealmente, armazene como '20YY'
    }

    Object.assign(card, updatePayload);

    return this.cardRepository.save(card);
  }

  // Remove um cartão do usuário
  async removeCard(id: string, userId: number): Promise<void> {
    const card = await this.findCardById(id, userId); // Garante que o cartão existe e pertence ao usuário
    const result = await this.cardRepository.delete({ id, userId });
    if (result.affected === 0) {
      throw new NotFoundException(
        `Cartão com ID "${id}" não encontrado ou já foi deletado.`,
      );
    }
  }
}
