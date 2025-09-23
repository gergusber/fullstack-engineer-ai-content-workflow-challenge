import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewState } from '../../../database/entities/content-piece.entity';
import { ReviewType, ReviewAction } from '../../../database/entities/review.entity';

export class UpdateReviewStateDto {
  @ApiProperty({
    description: 'New review state to transition to',
    enum: ReviewState,
    example: ReviewState.PENDING_REVIEW
  })
  @IsEnum(ReviewState)
  newState: ReviewState;

  @ApiProperty({
    description: 'Type of review being performed',
    enum: ReviewType,
    example: ReviewType.CONTENT_REVIEW
  })
  @IsEnum(ReviewType)
  reviewType: ReviewType;

  @ApiProperty({
    description: 'Action being taken in this review',
    enum: ReviewAction,
    example: ReviewAction.APPROVE
  })
  @IsEnum(ReviewAction)
  action: ReviewAction;

  @ApiPropertyOptional({
    description: 'Comments about the review decision',
    example: 'Content looks good, just needs minor formatting adjustments'
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({
    description: 'Suggestions for improvement',
    example: 'Consider adding more examples in the second paragraph'
  })
  @IsOptional()
  @IsString()
  suggestions?: string;

  @ApiPropertyOptional({
    description: 'Edited content changes made during review',
    example: {
      originalText: 'Summer is here...',
      editedText: 'Summer has arrived...',
      changes: ['grammar', 'tone']
    }
  })
  @IsOptional()
  editedContent?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'ID of the reviewer',
    example: 'reviewer@example.com'
  })
  @IsOptional()
  @IsString()
  reviewerId?: string;

  @ApiPropertyOptional({
    description: 'Name of the reviewer',
    example: 'John Smith'
  })
  @IsOptional()
  @IsString()
  reviewerName?: string;

  @ApiPropertyOptional({
    description: 'Role of the reviewer',
    example: 'Content Editor'
  })
  @IsOptional()
  @IsString()
  reviewerRole?: string;
}
