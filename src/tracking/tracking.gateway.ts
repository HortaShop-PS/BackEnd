import {
  WebSocketGateway, 
  WebSocketServer, 
  SubscribeMessage, 
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ 
  namespace: '/tracking', 
  cors: { origin: '*' } 
})
export class TrackingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log('Cliente conectado ao tracking:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('Cliente desconectado do tracking:', client.id);
  }

  @SubscribeMessage('joinOrder')
  handleJoinOrder(client: Socket, @MessageBody() data: { orderId: string }) {
    client.join(data.orderId);
    console.log(`Cliente ${client.id} entrou na sala do pedido ${data.orderId}`);
  }

  // Método para emitir atualizações de rastreamento
  emitTrackingUpdate(orderId: string, data: any) {
    this.server.to(orderId).emit('trackingUpdate', data);
  }
}