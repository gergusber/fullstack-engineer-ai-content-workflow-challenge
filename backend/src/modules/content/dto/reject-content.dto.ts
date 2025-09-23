import { IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RejectContentDto {
  @ApiProperty({
    description: 'ID of the reviewer rejecting the content',
    example: 'reviewer@example.com'
  })
  @IsString()
  reviewerId: string;

  @ApiProperty({
    description: 'Name of the reviewer rejecting the content',
    example: 'Jane Doe'
  })
  @IsString()
  reviewerName: string;

  @ApiProperty({
    description: 'Reason for rejecting the content',
    example: 'Content does not meet brand guidelines and requires significant revision'
  })
  @IsString()
  reason: string;

  @ApiPropertyOptional({
    description: 'Suggestions for improvement',
    example: 'Please revise the tone to be more professional and add more technical details in sections 2 and 3'
  })
  @IsOptional()
  @IsString()
  suggestions?: string;
}