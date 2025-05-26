export class ReviewResponseDto {
  id: string;
  userId: number;
  userName: string;
  productId: string;
  productName: string;
  rating: number;
  comment?: string;
  producerId?: number;
  producerName?: string;
  producerRating?: number;
  producerComment?: string;
  orderRating?: number;
  orderComment?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class ProductReviewsResponseDto {
  productId: string;
  productName: string;
  averageRating: number;
  totalReviews: number;
  reviews: ReviewResponseDto[];
}