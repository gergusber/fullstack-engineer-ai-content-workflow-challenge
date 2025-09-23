import { IsString, IsOptional, IsEnum, MaxLength, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CampaignStatus } from '../../../database/entities/campaign.entity';

export class CreateCampaignDto {
  @ApiProperty({
    description: 'Campaign name',
    example: 'Summer 2024 Product Launch',
    maxLength: 255
  })
  @IsString()
  @MaxLength(255)
  name: string;

  @ApiPropertyOptional({
    description: 'Campaign description',
    example: 'A comprehensive campaign for launching our new summer product line'
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Campaign status',
    enum: CampaignStatus,
    example: CampaignStatus.DRAFT
  })
  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;

  @ApiPropertyOptional({
    description: 'Target markets for international campaigns',
    type: [String],
    example: ['US', 'ES', 'DE'],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  targetMarkets?: string[];

  @ApiPropertyOptional({
    description: 'Tags or categories for quick filtering and search',
    type: [String],
    example: ['product-launch', 'summer', 'social-media'],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({
    description: 'User who created the campaign',
    example: 'user@example.com'
  })
  @IsOptional()
  @IsString()
  createdBy?: string;
}
