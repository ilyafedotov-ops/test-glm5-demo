import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsEnum, IsUUID, IsInt, Min, IsDateString, IsBoolean } from "class-validator";
import { Type } from "class-transformer";
import { TaskStatus, TaskPriority } from "./create-task.dto";

export class TaskQueryDto {
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

  @ApiPropertyOptional({ description: "Filter by status", enum: TaskStatus })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ description: "Filter by priority", enum: TaskPriority })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: "Filter by assignee ID" })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: "Filter by incident ID" })
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @ApiPropertyOptional({ description: "Filter by workflow ID" })
  @IsOptional()
  @IsUUID()
  workflowId?: string;

  @ApiPropertyOptional({ description: "Filter by team ID" })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ description: "Filter by violation ID" })
  @IsOptional()
  @IsUUID()
  violationId?: string;

  @ApiPropertyOptional({ description: "Filter by policy ID" })
  @IsOptional()
  @IsUUID()
  policyId?: string;

  @ApiPropertyOptional({ description: "Filter by source entity ID" })
  @IsOptional()
  @IsString()
  sourceEntityId?: string;

  @ApiPropertyOptional({ description: "Filter by source entity type" })
  @IsOptional()
  @IsString()
  sourceEntityType?: string;

  @ApiPropertyOptional({ description: "Filter by unified system record ID (<entityType>:<entityId>)" })
  @IsOptional()
  @IsString()
  systemRecordId?: string;

  @ApiPropertyOptional({ description: "Filter overdue tasks" })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  overdue?: boolean;

  @ApiPropertyOptional({ description: "Filter by due date from (ISO string)" })
  @IsOptional()
  @IsDateString()
  dueFrom?: string;

  @ApiPropertyOptional({ description: "Filter by due date to (ISO string)" })
  @IsOptional()
  @IsDateString()
  dueTo?: string;

  @ApiPropertyOptional({ description: "Search in title and description" })
  @IsOptional()
  @IsString()
  search?: string;
}
