import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RelatedRecord, TraceContext } from "@/common/system-links/system-links";

export class AuditLogEntity {
  @ApiProperty({ description: "Audit log ID" })
  id: string;

  @ApiPropertyOptional({ description: "Actor (user) ID" })
  actorId?: string;

  @ApiProperty({ description: "Actor type (user, system, api)" })
  actorType: string;

  @ApiPropertyOptional({ description: "Actor name" })
  actorName?: string;

  @ApiProperty({ description: "Action performed" })
  action: string;

  @ApiProperty({ description: "Resource type" })
  resource: string;

  @ApiPropertyOptional({ description: "Resource ID" })
  resourceId?: string;

  @ApiPropertyOptional({ description: "Previous value (before change)" })
  previousValue?: Record<string, any>;

  @ApiPropertyOptional({ description: "New value (after change)" })
  newValue?: Record<string, any>;

  @ApiPropertyOptional({ description: "Additional metadata" })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: "IP address" })
  ipAddress?: string;

  @ApiPropertyOptional({ description: "User agent" })
  userAgent?: string;

  @ApiProperty({ description: "Correlation ID for request tracing" })
  correlationId: string;

  @ApiPropertyOptional({ description: "Organization ID" })
  organizationId?: string;

  @ApiProperty({ description: "Timestamp" })
  createdAt: Date;

  @ApiProperty({
    description: "Globally unique system record identifier (<entityType>:<entityId>)",
    example: "audit_log:6f6f92ac-8f72-4042-a84a-f2aa79f4ebfb",
  })
  systemRecordId: string;

  @ApiProperty({
    type: TraceContext,
    description: "Trace fields used to correlate records across workflows, tasks, compliance, and audit logs",
  })
  traceContext: TraceContext;

  @ApiProperty({
    type: [RelatedRecord],
    description: "Cross-domain records related to this audit event",
  })
  relatedRecords: RelatedRecord[];
}

export class AuditLogListResponse {
  @ApiProperty({ type: [AuditLogEntity] })
  data: AuditLogEntity[];

  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class AuditLogDiff {
  @ApiProperty({ description: "Field path" })
  field: string;

  @ApiPropertyOptional({ description: "Old value" })
  oldValue?: any;

  @ApiPropertyOptional({ description: "New value" })
  newValue?: any;

  @ApiProperty({ description: "Type of change (added, removed, modified)" })
  changeType: "added" | "removed" | "modified";
}

export class AuditLogDetail extends AuditLogEntity {
  @ApiProperty({ type: [AuditLogDiff], description: "Field-level changes" })
  diffs: AuditLogDiff[];
}
