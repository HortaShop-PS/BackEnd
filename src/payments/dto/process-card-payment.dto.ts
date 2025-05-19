export class CardDetailsDto {
  number: string;
  name: string;
  expiry: string; // MM/YY
  cvv: string;
}

export class ProcessCardPaymentDto {
  orderId: number;
  amount: number;
  cardDetails: CardDetailsDto;
}
