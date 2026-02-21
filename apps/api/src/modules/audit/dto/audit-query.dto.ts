import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsDateString, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";

export class AuditQueryDto {
  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 50 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 50;

  @ApiPropertyOptional({ description: "Filter by actor (user) ID" })
  @IsOptional()
  @IsString()
  actorId?: string;

  @ApiPropertyOptional({ description: "Filter by action type" })
  @IsOptional()
  @IsString()
  action?: string;

  @ApiPropertyOptional({ description: "Filter by resource type" })
  @IsOptional()
  @IsString()
  resource?: string;

  @ApiPropertyOptional({ description: "Filter by resource ID" })
  @IsOptional()
  @IsString()
  resourceId?: string;

  @ApiPropertyOptional({ description: "Filter by correlation ID" })
  @IsOptional()
  @IsString()
  correlationId?: string;

  @ApiPropertyOptional({ description: "Filter by case type semantics (incident, workflow, task, etc.)" })
  @IsOptional()
  @IsString()
  caseType?: string;

  @ApiPropertyOptional({ description: "Filter transitions by source status" })
  @IsOptional()
  @IsString()
  transitionFrom?: string;

  @ApiPropertyOptional({ description: "Filter transitions by target status" })
  @IsOptional()
  @IsString()
  transitionTo?: string;

  @ApiPropertyOptional({ description: "Filter from date (ISO string)" })
  @IsOptional()
  @IsDateString()
  fromDate?: string;

  @ApiPropertyOptional({ description: "Filter to date (ISO string)" })
  @IsOptional()
  @IsDateString()
  toDate?: string;

  @ApiPropertyOptional({ description: "Search in action and resource" })
  @IsOptional()
  @IsString()
  search?: string;
}
