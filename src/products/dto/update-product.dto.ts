import { IsString, IsBoolean, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { CategoryEnum } from './create-product.dto';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isOrganic?: boolean;

  @IsOptional()
  @IsString()
  @IsEnum(CategoryEnum, { message: 'Categoria inválida. Escolha uma das opções válidas.' })
  category?: CategoryEnum;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsNumber()
  stock?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;

  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @IsOptional()
  @IsString()
  origin?: string;

  @IsOptional()
  @IsString()
  harvestSeason?: string;
}