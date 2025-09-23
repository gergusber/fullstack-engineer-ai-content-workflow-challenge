import { IsString, IsOptional, IsEnum, MaxLength, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ReviewState, Priority } from '../../../database/entities/content-piece.entity';

export class UpdateContentPieceDto {
  @ApiPropertyOptional({
    description: 'Updated title of the content piece',
    example: 'How to Use Our Summer Collection - Updated',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({
    description: 'Updated description of the content piece',
    example: 'A comprehensive and updated guide showcasing the versatility of our summer collection'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated review state of the content piece',
    enum: ReviewState,
    example: ReviewState.PENDING_REVIEW
  })
  @IsOptional()
  @IsEnum(ReviewState)
  reviewState?: ReviewState;

  @ApiPropertyOptional({
    description: 'Updated priority level of the content piece',
    enum: Priority,
    example: Priority.HIGH
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Updated metadata for the content piece',
    example: {
      seoKeywords: ['summer', 'fashion', 'trends', 'updated'],
      targetAudience: 'young professionals',
      wordCount: 1800,
      lastOptimization: '2024-07-15'
    }
  })
  @IsOptional()
  contentMetadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Updated final approved text of the content piece',
    example: 'Summer is here and with it comes the perfect opportunity to refresh your wardrobe with our latest collection...'
  })
  @IsOptional()
  @IsString()
  finalText?: string;

  @ApiPropertyOptional({
    description: 'Updated version history with new changes',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        version: { type: 'number', example: 2 },
        text: { type: 'string', example: 'Second version with improvements...' },
        editedBy: { type: 'string', example: 'editor@example.com' },
        editedAt: { type: 'string', format: 'date-time', example: '2024-07-16T14:30:00Z' },
        changeReason: { type: 'string', example: 'Content optimization and SEO improvements' }
      }
    },
    example: [{
      version: 2,
      text: 'Second version with improvements...',
      editedBy: 'editor@example.com',
      editedAt: '2024-07-16T14:30:00Z',
      changeReason: 'Content optimization and SEO improvements'
    }]
  })
  @IsOptional()
  @IsArray()
  versionHistory?: Array<{
    version: number;
    text: string;
    editedBy: string;
    editedAt: Date;
    changeReason?: string;
  }>;

  @ApiPropertyOptional({
    description: 'Reason for this update/change',
    example: 'Updated content based on reviewer feedback'
  })
  @IsOptional()
  @IsString()
  changeReason?: string;

  @ApiPropertyOptional({
    description: 'User who made this update',
    example: 'content-editor@example.com'
  })
  @IsOptional()
  @IsString()
  updatedBy?: string;
}