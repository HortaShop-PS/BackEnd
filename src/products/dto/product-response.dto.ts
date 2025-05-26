export class ProductResponseDto {
  id: string;
  name: string;
  price: number;
  unit: string;
  imageUrl?: string;
  isNew: boolean;
  isFeatured: boolean;
  category?: string;
  isOrganic: boolean;
  origin?: string;
  description?: string;
  stock?: number;
  harvestSeason?: string;
  averageRating?: number;
  totalReviews?: number;
}