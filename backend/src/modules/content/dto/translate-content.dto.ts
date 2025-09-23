import { IsString, IsEnum, IsOptional, IsUUID } from 'class-validator';

export class TranslateContentDto {
  @IsString()
  sourceLanguage: string;

  @IsString()
  targetLanguage: string;

  @IsOptional()
  @IsString()
  context?: string;

  @IsOptional()
  @IsEnum(['openai', 'claude'])
  model?: 'openai' | 'claude' = 'claude';

  @IsOptional()
  @IsString()
  translationType?: 'literal' | 'localized' | 'culturally_adapted' = 'localized';

  @IsOptional()
  @IsUUID()
  userId?: string;
}
