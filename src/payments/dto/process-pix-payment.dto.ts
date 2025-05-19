export class ProcessPixPaymentDto {
  /**
   * ProcessPixPaymentDto class is used to transfer data for PIX payment processing
   * @property orderId - The unique identifier of the order to be paid
   * @property amount - The payment amount in the smallest monetary unit (e.g. cents)
   */
  orderId: number;
  amount: number;
}
