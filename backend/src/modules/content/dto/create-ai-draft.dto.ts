import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsUUID, IsObject } from 'class-validator';
import { AIModel, GenerationType } from '../../../database/entities/ai-draft.entity';

export class CreateAIDraftDto {
  @IsUUID()
  contentPieceId: string;

  @IsEnum(AIModel)
  modelUsed: AIModel;

  @IsOptional()
  @IsString()
  modelVersion?: string;

  @IsEnum(GenerationType)
  generationType: GenerationType;

  @IsOptional()
  @IsString()
  generatedTitle?: string;

  @IsOptional()
  @IsString()
  generatedDesc?: string;

  @IsOptional()
  @IsObject()
  generatedContent?: Record<string, any>;

  @IsString()
  prompt: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  responseTime?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tokenCount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  qualityScore?: number;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(5)
  userRating?: number;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
