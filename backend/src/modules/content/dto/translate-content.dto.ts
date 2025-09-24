import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class TranslateContentDto {
  @ApiProperty({
    description: 'Source language code',
    example: 'en'
  })
  @IsString()
  sourceLanguage: string;

  @ApiProperty({
    description: 'Target language code for translation',
    example: 'es'
  })
  @IsString()
  targetLanguage: string;

  @ApiPropertyOptional({
    description: 'Additional context for translation',
    example: 'Professional fashion content for Spanish market, maintain professional tone while adapting cultural references'
  })
  @IsOptional()
  @IsString()
  context?: string;

  @ApiPropertyOptional({
    description: 'AI model to use for translation',
    enum: ['openai', 'claude'],
    example: 'claude',
    default: 'claude'
  })
  @IsOptional()
  @IsEnum(['openai', 'claude'])
  model?: 'openai' | 'claude' = 'claude';

  @ApiPropertyOptional({
    description: 'Type of translation to perform',
    enum: ['literal', 'localized', 'culturally_adapted'],
    example: 'localized',
    default: 'localized'
  })
  @IsOptional()
  @IsString()
  translationType?: 'literal' | 'localized' | 'culturally_adapted' = 'localized';

  @ApiPropertyOptional({
    description: 'ID of the user requesting the translation',
    example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
    format: 'uuid'
  })
  @IsOptional()
  @IsUUID()
  userId?: string;
}
