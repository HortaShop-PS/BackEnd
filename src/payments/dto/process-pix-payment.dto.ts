import { IsNumber, IsNotEmpty, Min } from 'class-validator';

export class ProcessPixPaymentDto {
  /**
   * Classe ProcessPixPaymentDto é usada para transferir dados para processamento de pagamento PIX
   * @property orderId - O identificador único do pedido a ser pago
   * @property amount - O valor do pagamento na menor unidade monetária (ex: centavos)
   */
  @IsNumber()
  @IsNotEmpty()
  orderId: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0.01) // Assumindo que o valor deve ser positivo
  amount: number;
}
