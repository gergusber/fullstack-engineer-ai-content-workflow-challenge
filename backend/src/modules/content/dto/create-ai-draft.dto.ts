import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsUUID, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AIModel, GenerationType, DraftStatus } from '../../../database/entities/ai-draft.entity';

export class CreateAIDraftDto {
  @ApiProperty({
    description: 'ID of the content piece this AI draft belongs to',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid'
  })
  @IsUUID()
  contentPieceId: string;

  @ApiProperty({
    description: 'AI model used to generate this draft',
    enum: AIModel,
    example: AIModel.CLAUDE
  })
  @IsEnum(AIModel)
  modelUsed: AIModel;

  @ApiPropertyOptional({
    description: 'Version of the AI model used',
    example: '3.5-sonnet'
  })
  @IsOptional()
  @IsString()
  modelVersion?: string;

  @ApiProperty({
    description: 'Type of content generation performed',
    enum: GenerationType,
    example: GenerationType.ORIGINAL
  })
  @IsEnum(GenerationType)
  generationType: GenerationType;

  @ApiProperty({
    description: 'Generated content in structured format',
    example: {
      title: 'Summer Fashion Trends 2024',
      description: 'Discover the hottest fashion trends for summer',
      body: 'This summer brings exciting new trends...',
      keywords: ['summer', 'fashion', 'trends']
    }
  })
  @IsObject()
  generatedContent: {
    title?: string;
    description?: string;
    body?: string;
    [key: string]: any;
  };

  @ApiPropertyOptional({
    description: 'Status of this AI draft',
    enum: DraftStatus,
    example: DraftStatus.CANDIDATE
  })
  @IsOptional()
  @IsEnum(DraftStatus)
  status?: DraftStatus;

  @ApiProperty({
    description: 'Prompt used to generate this content',
    example: 'Write a blog post about summer fashion trends for young professionals, focusing on versatile pieces that work for both work and weekend.'
  })
  @IsString()
  prompt: string;

  @ApiPropertyOptional({
    description: 'Temperature parameter used for generation (0-2)',
    example: 0.7,
    minimum: 0,
    maximum: 2
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @ApiPropertyOptional({
    description: 'Maximum tokens parameter used for generation',
    example: 2000,
    minimum: 1,
    maximum: 4000
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @ApiPropertyOptional({
    description: 'Response time in milliseconds',
    example: 3500,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  responseTimeMs?: number;

  @ApiPropertyOptional({
    description: 'Number of tokens used in generation',
    example: 1847,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  tokenCount?: number;

  @ApiPropertyOptional({
    description: 'Cost of generation in USD',
    example: 0.0234,
    minimum: 0
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  costUsd?: number;

  @ApiPropertyOptional({
    description: 'Quality score of the generated content (0-1)',
    example: 0.85,
    minimum: 0,
    maximum: 1
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  qualityScore?: number;

  @ApiPropertyOptional({
    description: 'User rating of the generated content (1-5)',
    example: 4,
    minimum: 1,
    maximum: 5
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  userRating?: number;

  @ApiPropertyOptional({
    description: 'Additional metadata for the AI draft',
    example: {
      generatedAt: '2024-07-15T10:30:00Z',
      contentLength: 1847,
      readabilityScore: 85,
      seoScore: 92
    }
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
