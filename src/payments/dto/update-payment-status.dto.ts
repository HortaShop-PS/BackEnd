import { IsString, IsNotEmpty, IsIn } from 'class-validator';

export class UpdatePaymentStatusDto {
  @IsString()
  @IsNotEmpty()
  paymentId: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(['pending', 'completed', 'failed'], {
    message: 'Status deve ser um dos seguintes: pending, completed, failed',
  })
  status: string;
}