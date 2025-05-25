import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import {
  ReviewResponseDto,
  ProductReviewsResponseDto,
} from './dto/review-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  async createReview(
    @Request() req,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewResponseDto> {
    return this.reviewsService.createReview(req.user.id, createReviewDto);
  }

  @Get('products/:productId')
  async getProductReviews(
    @Param('productId', ParseUUIDPipe) productId: string,
  ): Promise<ProductReviewsResponseDto> {
    return this.reviewsService.getProductReviews(productId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getUserReviews(@Request() req): Promise<ReviewResponseDto[]> {
    return this.reviewsService.getUserReviews(req.user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':reviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteReview(
    @Request() req,
    @Param('reviewId', ParseUUIDPipe) reviewId: string,
  ): Promise<void> {
    return this.reviewsService.deleteReview(req.user.id, reviewId);
  }
}
