import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { ReviewState, Priority } from '../../../database/entities/content-piece.entity';

export class UpdateContentPieceDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ReviewState)
  reviewState?: ReviewState;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  contentMetadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  changeReason?: string;

  @IsOptional()
  @IsString()
  updatedBy?: string;
}