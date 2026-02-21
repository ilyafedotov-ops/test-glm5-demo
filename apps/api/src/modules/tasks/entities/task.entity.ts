import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RelatedRecord, TraceContext } from "@/common/system-links/system-links";

export class TaskEntity {
  @ApiProperty({ description: "Task ID" })
  id: string;

  @ApiProperty({ description: "Task title" })
  title: string;

  @ApiPropertyOptional({ description: "Task description" })
  description?: string;

  @ApiProperty({ description: "Task status" })
  status: string;

  @ApiProperty({ description: "Task priority" })
  priority: string;

  @ApiPropertyOptional({ description: "Assignee user ID" })
  assigneeId?: string;

  @ApiPropertyOptional({ description: "Assignee name" })
  assigneeName?: string;

  @ApiPropertyOptional({ description: "Reporter user ID" })
  reporterId?: string;

  @ApiPropertyOptional({ description: "Reporter name" })
  reporterName?: string;

  @ApiPropertyOptional({ description: "Incident ID" })
  incidentId?: string;

  @ApiPropertyOptional({ description: "Incident title" })
  incidentTitle?: string;

  @ApiPropertyOptional({ description: "Workflow ID" })
  workflowId?: string;

  @ApiPropertyOptional({ description: "Violation ID" })
  violationId?: string;

  @ApiPropertyOptional({ description: "Policy ID" })
  policyId?: string;

  @ApiPropertyOptional({ description: "Source entity ID that originated this task" })
  sourceEntityId?: string;

  @ApiPropertyOptional({ description: "Source entity type that originated this task" })
  sourceEntityType?: string;

  @ApiPropertyOptional({ description: "Team ID" })
  teamId?: string;

  @ApiPropertyOptional({ description: "Team name" })
  teamName?: string;

  @ApiPropertyOptional({ description: "Due date" })
  dueAt?: Date;

  @ApiPropertyOptional({ description: "Started at timestamp" })
  startedAt?: Date;

  @ApiPropertyOptional({ description: "Completed at timestamp" })
  completedAt?: Date;

  @ApiPropertyOptional({ description: "Estimated time in minutes" })
  estimatedMinutes?: number;

  @ApiPropertyOptional({ description: "Actual time in minutes" })
  actualMinutes?: number;

  @ApiPropertyOptional({ description: "Tags" })
  tags?: string[];

  @ApiPropertyOptional({ description: "Additional metadata" })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: "SLA status" })
  slaStatus?: "on_track" | "at_risk" | "breached" | "completed";

  @ApiPropertyOptional({ description: "Time remaining in minutes" })
  timeRemaining?: number;

  @ApiProperty({ description: "Created at timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Updated at timestamp" })
  updatedAt: Date;

  @ApiProperty({
    description: "Globally unique system record identifier (<entityType>:<entityId>)",
    example: "task:7f96f9d2-08e1-4f57-bd47-44918cc32296",
  })
  systemRecordId: string;

  @ApiProperty({
    type: TraceContext,
    description: "Trace fields used to correlate records across workflows, tasks, compliance, and audit logs",
  })
  traceContext: TraceContext;

  @ApiProperty({
    type: [RelatedRecord],
    description: "Cross-domain records related to this task",
  })
  relatedRecords: RelatedRecord[];
}

export class TaskListResponse {
  @ApiProperty({ type: [TaskEntity] })
  data: TaskEntity[];

  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class TaskStats {
  @ApiProperty({ description: "Total tasks" })
  total: number;

  @ApiProperty({ description: "Pending tasks" })
  pending: number;

  @ApiProperty({ description: "In progress tasks" })
  inProgress: number;

  @ApiProperty({ description: "Completed tasks" })
  completed: number;

  @ApiProperty({ description: "Overdue tasks" })
  overdue: number;

  @ApiProperty({ description: "Critical priority tasks" })
  critical: number;

  @ApiProperty({ description: "High priority tasks" })
  high: number;

  @ApiProperty({ description: "Average completion time in minutes" })
  avgCompletionTime: number;
}
