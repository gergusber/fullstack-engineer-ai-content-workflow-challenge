import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { CampaignStatus } from '../../../database/entities/campaign.entity';

export class UpdateCampaignDto {
  @IsOptional()
  @IsString()
  @MaxLength(255)
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(CampaignStatus)
  status?: CampaignStatus;
}

