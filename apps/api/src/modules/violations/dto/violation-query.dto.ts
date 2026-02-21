import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, IsDateString } from "class-validator";
import { Type } from "class-transformer";
import { ViolationSeverity, ViolationStatus } from "./create-violation.dto";

export class ViolationQueryDto {
  @ApiPropertyOptional({ description: "Page number", default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: "Items per page", default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: "Filter by status", enum: ViolationStatus })
  @IsOptional()
  @IsEnum(ViolationStatus)
  status?: ViolationStatus;

  @ApiPropertyOptional({ description: "Filter by severity", enum: ViolationSeverity })
  @IsOptional()
  @IsEnum(ViolationSeverity)
  severity?: ViolationSeverity;

  @ApiPropertyOptional({ description: "Filter by policy ID" })
  @IsOptional()
  @IsUUID()
  policyId?: string;

  @ApiPropertyOptional({ description: "Filter by assignee ID" })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: "Filter by entity ID" })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: "Filter by entity type" })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: "Filter by unified system record ID (<entityType>:<entityId>)" })
  @IsOptional()
  @IsString()
  systemRecordId?: string;

  @ApiPropertyOptional({ description: "Search in title and description" })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: "Detected after date (ISO string)" })
  @IsOptional()
  @IsDateString()
  detectedAfter?: string;

  @ApiPropertyOptional({ description: "Detected before date (ISO string)" })
  @IsOptional()
  @IsDateString()
  detectedBefore?: string;
}
