import { IsString, IsOptional, IsEnum, MaxLength, IsUUID } from 'class-validator';
import { ContentType, Priority } from '../../../database/entities/content-piece.entity';

export class CreateContentPieceDto {
  @IsUUID()
  campaignId: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(ContentType)
  contentType: ContentType;

  @IsOptional()
  @IsString()
  targetLanguage?: string = 'en';

  @IsOptional()
  @IsString()
  sourceLanguage?: string = 'en';

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  originalPrompt?: string;

  @IsOptional()
  contentMetadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  createdBy?: string;
}
