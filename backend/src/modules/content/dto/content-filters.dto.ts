import {
  IsOptional,
  IsEnum,
  IsString,
  IsNumber,
  Min,
  IsUUID,
} from "class-validator";
import {
  ReviewState,
  ContentType,
  Priority,
} from "../../../database/entities/content-piece.entity";

export class ContentFiltersDto {
  @IsOptional()
  @IsUUID()
  campaignId?: string;

  @IsOptional()
  @IsEnum(ReviewState)
  reviewState?: ReviewState;

  @IsOptional()
  @IsEnum(ContentType)
  contentType?: ContentType;

  @IsOptional()
  @IsEnum(Priority)
  priority?: Priority;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  createdBy?: string;

  @IsOptional()
  @IsString()
  dateFrom?: string; // ISO date string

  @IsOptional()
  @IsString()
  dateTo?: string; // ISO date string

  @IsOptional()
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @IsOptional()
  @IsEnum(["createdAt", "updatedAt", "title", "priority", "reviewState"])
  sortBy?: "createdAt" | "updatedAt" | "title" | "priority" | "reviewState" =
    "createdAt";

  @IsOptional()
  @IsEnum(["ASC", "DESC"])
  sortOrder?: "ASC" | "DESC" = "DESC";
}
