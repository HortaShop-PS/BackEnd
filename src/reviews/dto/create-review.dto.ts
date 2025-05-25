import { IsNotEmpty, IsNumber, IsString, IsUUID, IsOptional, Min, Max } from 'class-validator';

export class CreateReviewDto {
  @IsNotEmpty()
  @IsUUID()
  productId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsUUID()
  orderItemId?: string;

  // Producer review fields
  @IsOptional()
  @IsNumber()
  producerId?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  producerRating?: number;

  @IsOptional()
  @IsString()
  producerComment?: string;

  // Order review fields
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  orderRating?: number;

  @IsOptional()
  @IsString()
  orderComment?: string;
}