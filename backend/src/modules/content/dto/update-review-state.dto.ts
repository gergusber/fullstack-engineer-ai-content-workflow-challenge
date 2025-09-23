import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReviewState } from '../../../database/entities/content-piece.entity';
import { ReviewType, ReviewAction } from '../../../database/entities/review.entity';

export class UpdateReviewStateDto {
  @IsEnum(ReviewState)
  newState: ReviewState;

  @IsEnum(ReviewType)
  reviewType: ReviewType;

  @IsEnum(ReviewAction)
  action: ReviewAction;

  @IsOptional()
  @IsString()
  comments?: string;

  @IsOptional()
  @IsString()
  suggestions?: string;

  @IsOptional()
  editedContent?: Record<string, any>;

  @IsOptional()
  @IsString()
  reviewerId?: string;

  @IsOptional()
  @IsString()
  reviewerName?: string;

  @IsOptional()
  @IsString()
  reviewerRole?: string;
}
