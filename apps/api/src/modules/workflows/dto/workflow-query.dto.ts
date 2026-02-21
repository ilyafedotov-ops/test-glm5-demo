import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min } from "class-validator";
import { Type } from "class-transformer";
import { WorkflowStatus, WorkflowType } from "./create-workflow.dto";

export class WorkflowQueryDto {
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

  @ApiPropertyOptional({ description: "Filter by status", enum: WorkflowStatus })
  @IsOptional()
  @IsEnum(WorkflowStatus)
  status?: WorkflowStatus;

  @ApiPropertyOptional({ description: "Filter by type", enum: WorkflowType })
  @IsOptional()
  @IsEnum(WorkflowType)
  type?: WorkflowType;

  @ApiPropertyOptional({ description: "Filter by entity ID" })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: "Filter by unified system record ID (<entityType>:<entityId>)" })
  @IsOptional()
  @IsString()
  systemRecordId?: string;

  @ApiPropertyOptional({ description: "Filter by incident ID" })
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @ApiPropertyOptional({ description: "Search by name" })
  @IsOptional()
  @IsString()
  search?: string;
}
