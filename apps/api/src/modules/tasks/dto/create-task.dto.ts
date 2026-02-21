import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, IsUUID, IsDateString, IsInt, Min, IsArray, MaxLength, IsObject } from "class-validator";

export enum TaskStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum TaskPriority {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export class CreateTaskDto {
  @ApiProperty({ description: "Task title" })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiPropertyOptional({ description: "Task description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Task status", enum: TaskStatus, default: TaskStatus.PENDING })
  @IsOptional()
  @IsEnum(TaskStatus)
  status?: TaskStatus;

  @ApiPropertyOptional({ description: "Task priority", enum: TaskPriority, default: TaskPriority.MEDIUM })
  @IsOptional()
  @IsEnum(TaskPriority)
  priority?: TaskPriority;

  @ApiPropertyOptional({ description: "Assignee user ID" })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: "Incident ID to link" })
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @ApiPropertyOptional({ description: "Workflow ID to link" })
  @IsOptional()
  @IsUUID()
  workflowId?: string;

  @ApiPropertyOptional({ description: "Violation ID to link" })
  @IsOptional()
  @IsUUID()
  violationId?: string;

  @ApiPropertyOptional({ description: "Policy ID to link" })
  @IsOptional()
  @IsUUID()
  policyId?: string;

  @ApiPropertyOptional({ description: "Source entity ID that originated this task" })
  @IsOptional()
  @IsString()
  sourceEntityId?: string;

  @ApiPropertyOptional({ description: "Source entity type that originated this task" })
  @IsOptional()
  @IsString()
  sourceEntityType?: string;

  @ApiPropertyOptional({ description: "Team ID" })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ description: "Due date (ISO string)" })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ description: "Estimated time in minutes" })
  @IsOptional()
  @IsInt()
  @Min(0)
  estimatedMinutes?: number;

  @ApiPropertyOptional({ description: "Tags" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
