import { IsOptional, IsString, IsArray } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SubmitForReviewDto {
  @ApiPropertyOptional({
    description: 'Array of reviewer IDs to assign for review',
    type: [String],
    example: ['reviewer1@example.com', 'reviewer2@example.com'],
    isArray: true
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  reviewerIds?: string[];

  @ApiPropertyOptional({
    description: 'Priority level for this review',
    example: 'high'
  })
  @IsOptional()
  @IsString()
  priority?: string;

  @ApiPropertyOptional({
    description: 'Comments or notes for the reviewers',
    example: 'Please focus on the SEO aspects and readability of this content'
  })
  @IsOptional()
  @IsString()
  comments?: string;
}