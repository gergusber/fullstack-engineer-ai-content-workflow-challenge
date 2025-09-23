import { IsString, IsOptional, IsEnum, MaxLength, IsUUID, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentType, Priority } from '../../../database/entities/content-piece.entity';

export class CreateContentPieceDto {
  @ApiProperty({
    description: 'ID of the campaign this content piece belongs to',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid'
  })
  @IsUUID()
  campaignId: string;

  @ApiPropertyOptional({
    description: 'Title of the content piece',
    example: 'How to Use Our Summer Collection',
    maxLength: 500
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  title?: string;

  @ApiPropertyOptional({
    description: 'Description of the content piece',
    example: 'A comprehensive guide showcasing the versatility of our summer collection'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({
    description: 'Type of content',
    enum: ContentType,
    example: ContentType.BLOG_POST
  })
  @IsEnum(ContentType)
  contentType: ContentType;

  @ApiPropertyOptional({
    description: 'Target language for the content',
    example: 'en',
    default: 'en'
  })
  @IsOptional()
  @IsString()
  targetLanguage?: string = 'en';

  @ApiPropertyOptional({
    description: 'Source language for translation',
    example: 'en',
    default: 'en'
  })
  @IsOptional()
  @IsString()
  sourceLanguage?: string = 'en';

  @ApiPropertyOptional({
    description: 'Priority level of the content piece',
    enum: Priority,
    example: Priority.MEDIUM
  })
  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @ApiPropertyOptional({
    description: 'Original prompt used for AI generation',
    example: 'Write a blog post about summer fashion trends for young professionals'
  })
  @IsOptional()
  @IsString()
  originalPrompt?: string;

  @ApiPropertyOptional({
    description: 'Additional metadata for the content piece',
    example: {
      seoKeywords: ['summer', 'fashion', 'trends'],
      targetAudience: 'young professionals',
      wordCount: 1500
    }
  })
  @IsOptional()
  contentMetadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'ID of the content piece this is a translation of',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d480',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  translationOf?: string;

  @ApiPropertyOptional({
    description: 'Final approved text of the content piece',
    example: 'Summer is here and with it comes the perfect opportunity to refresh your wardrobe...'
  })
  @IsOptional()
  @IsString()
  finalText?: string;

  @ApiPropertyOptional({
    description: 'Version history tracking changes made to the content',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        version: { type: 'number', example: 1 },
        text: { type: 'string', example: 'Updated version of the content...' },
        editedBy: { type: 'string', example: 'editor@example.com' },
        editedAt: { type: 'string', format: 'date-time', example: '2024-07-15T10:30:00Z' },
        changeReason: { type: 'string', example: 'Updated for SEO optimization' }
      }
    },
    example: [{
      version: 1,
      text: 'Updated version of the content...',
      editedBy: 'editor@example.com',
      editedAt: '2024-07-15T10:30:00Z',
      changeReason: 'Updated for SEO optimization'
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
    description: 'User who created the content piece',
    example: 'content-creator@example.com'
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
