import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ReviewsService } from './reviews.service';

@Injectable()
export class ReviewsListener {
  constructor(private readonly reviewsService: ReviewsService) {}

  @OnEvent('order.delivered')
  async handleOrderDeliveredEvent(payload: {
    orderId: string;
    userId: number;
    items: { id: string; productId: string; productName: string }[];
  }) {
    console.log(`Pedido ${payload.orderId} foi entregue. Notificando usuário ${payload.userId} para avaliar os produtos.`);
    
    // Aqui você pode implementar a lógica para notificar o usuário
    // Por exemplo, enviar um e-mail, uma notificação push, ou salvar uma notificação no banco de dados
    
    // Exemplo de log dos produtos que podem ser avaliados
    payload.items.forEach(item => {
      console.log(`- Produto disponível para avaliação: ${item.productName} (ID: ${item.productId})`);
    });
  }
}