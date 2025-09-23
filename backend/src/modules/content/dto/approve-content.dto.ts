import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveContentDto {
  @ApiProperty({
    description: 'ID of the reviewer approving the content',
    example: 'reviewer@example.com'
  })
  @IsString()
  reviewerId: string;

  @ApiProperty({
    description: 'Name of the reviewer approving the content',
    example: 'John Smith'
  })
  @IsString()
  reviewerName: string;

  @ApiPropertyOptional({
    description: 'Comments about the approval',
    example: 'Content meets all quality standards and is ready for publication'
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({
    description: 'Whether to publish the content immediately after approval',
    example: false,
    default: false
  })
  @IsOptional()
  @IsBoolean()
  publishImmediately?: boolean;
}