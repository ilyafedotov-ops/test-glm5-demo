import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsObject, IsEnum, IsUUID, IsArray, ValidateNested } from "class-validator";
import { Type } from "class-transformer";

export enum WorkflowType {
  INCIDENT_ESCALATION = "incident_escalation",
  APPROVAL = "approval",
  CHANGE_REQUEST = "change_request",
  ONBOARDING = "onboarding",
  OFFBOARDING = "offboarding",
  REVIEW = "review",
}

export enum WorkflowStatus {
  PENDING = "pending",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  FAILED = "failed",
}

export class WorkflowStepDto {
  @ApiProperty({ description: "Step identifier" })
  @IsString()
  id: string;

  @ApiProperty({ description: "Step name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Step description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: "Step type", enum: ["auto", "manual", "approval"] })
  @IsEnum(["auto", "manual", "approval"])
  type: "auto" | "manual" | "approval";

  @ApiPropertyOptional({ description: "Assigned user or role" })
  @IsOptional()
  @IsString()
  assignee?: string;

  @ApiPropertyOptional({ description: "Step configuration" })
  @IsOptional()
  @IsObject()
  config?: Record<string, any>;

  @ApiPropertyOptional({ description: "Next step transitions" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  nextSteps?: string[];
}

export class CreateWorkflowDto {
  @ApiProperty({ description: "Workflow name" })
  @IsString()
  name: string;

  @ApiProperty({ description: "Workflow type", enum: WorkflowType })
  @IsEnum(WorkflowType)
  type: WorkflowType;

  @ApiPropertyOptional({ description: "Entity ID this workflow is for" })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: "Entity type (e.g., incident, user)" })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: "Incident ID to link" })
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @ApiProperty({ description: "Workflow steps", type: [WorkflowStepDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkflowStepDto)
  steps: WorkflowStepDto[];

  @ApiPropertyOptional({ description: "Initial workflow context data" })
  @IsOptional()
  @IsObject()
  context?: Record<string, any>;
}
