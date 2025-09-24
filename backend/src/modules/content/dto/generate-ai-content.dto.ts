import { IsString, IsEnum, IsOptional, IsNumber, Min, Max, IsUUID } from 'class-validator';

export class GenerateAIContentDto {
  @IsString()
  prompt: string;

  @IsOptional()
  @IsEnum(['openai', 'claude', 'both'])
  model?: 'openai' | 'claude' | 'both' = 'claude';

  @IsOptional()
  @IsString()
  type?: 'original' | 'variation' | 'improvement' = 'original';

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2)
  temperature?: number = 0.7;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(4000)
  maxTokens?: number = 1000;

  @IsOptional()
  @IsString()
  tone?: 'professional' | 'casual' | 'creative' | 'urgent';

  @IsOptional()
  userId?: string;

  @IsOptional()
  @IsString()
  userName?: string;

  @IsOptional()
  context?: Record<string, any>;
}

