import { IsString, IsOptional, IsEnum, MaxLength, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '../../../database/entities/campaign.entity';

export class UpdateCampaignDto {
  @ApiPropertyOptional({
    description: 'Updated campaign name',
    example: 'Summer 2024 Product Launch - Updated',
    maxLength: 255
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated campaign description',
    example: 'An enhanced comprehensive campaign for launching our new summer product line with extended reach'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Updated campaign status',
    enum: CampaignStatus,
    example: CampaignStatus.ACTIVE
  })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({
    description: 'Updated target markets for international campaigns',
    type: [String],
    example: ['US', 'ES', 'DE', 'FR', 'IT'],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetMarkets?: string[];

  @ApiPropertyOptional({
    description: 'Updated tags or categories for quick filtering and search',
    type: [String],
    example: ['product-launch', 'summer', 'social-media', 'international'],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];
}

