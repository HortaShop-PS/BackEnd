import { IsString, IsBoolean, IsOptional, IsNumber, IsUrl, IsEnum } from 'class-validator'

export enum CategoryEnum {
  VEGETAIS = 'Vegetais',
  FRUTAS = 'Frutas',
  ORGANICOS = 'Orgânicos',
  LATICINIOS = 'Laticínios',
  EMBUTIDOS = 'Embutidos',
  GRAOS = 'Grãos',
  TEMPEROS = 'Temperos',
  BEBIDAS = 'Bebidas',
  DOCES = 'Doces',
  OUTROS = 'Outros'
}

export class CreateProductDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsBoolean()
  isOrganic: boolean;

  @IsOptional()
  @IsString()
  @IsEnum(CategoryEnum, { message: 'Categoria inválida. Escolha uma das opções válidas.' })
  category?: CategoryEnum;

  @IsNumber()
  price: number;

  @IsString()
  unit: string;

  @IsOptional()
  @IsNumber()
  quantity?: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}
