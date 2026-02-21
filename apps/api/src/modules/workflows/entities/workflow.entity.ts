import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RelatedRecord, TraceContext } from "@/common/system-links/system-links";

export interface WorkflowStep {
  id: string;
  name: string;
  description?: string;
  type: "auto" | "manual" | "approval";
  assignee?: string;
  config?: Record<string, any>;
  nextSteps?: string[];
  status?: "pending" | "in_progress" | "completed" | "failed" | "skipped";
  completedAt?: Date;
  completedBy?: string;
  output?: Record<string, any>;
}

export class WorkflowEntity {
  @ApiProperty({ description: "Workflow ID" })
  id: string;

  @ApiProperty({ description: "Workflow name" })
  name: string;

  @ApiProperty({ description: "Workflow type" })
  type: string;

  @ApiProperty({ description: "Workflow status" })
  status: string;

  @ApiPropertyOptional({ description: "Entity ID" })
  entityId?: string;

  @ApiPropertyOptional({ description: "Entity type" })
  entityType?: string;

  @ApiPropertyOptional({ description: "Organization ID" })
  organizationId?: string;

  @ApiPropertyOptional({ description: "Current step ID" })
  currentStepId?: string;

  @ApiProperty({ description: "Workflow steps", type: "array" })
  steps: WorkflowStep[];

  @ApiProperty({ description: "Workflow context data" })
  context: Record<string, any>;

  @ApiPropertyOptional({ description: "Incident ID" })
  incidentId?: string;

  @ApiPropertyOptional({ description: "Completed at timestamp" })
  completedAt?: Date;

  @ApiProperty({ description: "Created at timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Updated at timestamp" })
  updatedAt: Date;

  @ApiProperty({
    description: "Globally unique system record identifier (<entityType>:<entityId>)",
    example: "workflow:8e8d4efa-4d8f-43fd-9ebf-4f3e06cf60e4",
  })
  systemRecordId: string;

  @ApiProperty({
    type: TraceContext,
    description: "Trace fields used to correlate records across workflows, tasks, compliance, and audit logs",
  })
  traceContext: TraceContext;

  @ApiProperty({
    type: [RelatedRecord],
    description: "Cross-domain records related to this workflow",
  })
  relatedRecords: RelatedRecord[];
}

export class WorkflowListResponse {
  @ApiProperty({ type: [WorkflowEntity] })
  data: WorkflowEntity[];

  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
