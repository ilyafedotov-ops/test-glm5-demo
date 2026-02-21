import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RelatedRecord, TraceContext } from "@/common/system-links/system-links";

export class ViolationEntity {
  @ApiProperty({ description: "Violation ID" })
  id: string;

  @ApiProperty({ description: "Policy ID" })
  policyId: string;

  @ApiPropertyOptional({ description: "Policy name" })
  policyName?: string;

  @ApiProperty({ description: "Entity ID" })
  entityId: string;

  @ApiProperty({ description: "Entity type" })
  entityType: string;

  @ApiProperty({ description: "Violation status" })
  status: string;

  @ApiProperty({ description: "Violation severity" })
  severity: string;

  @ApiProperty({ description: "Violation title" })
  title: string;

  @ApiProperty({ description: "Detailed description" })
  description: string;

  @ApiPropertyOptional({ description: "Remediation steps" })
  remediation?: string;

  @ApiPropertyOptional({ description: "Assignee user ID" })
  assigneeId?: string;

  @ApiPropertyOptional({ description: "Assignee name" })
  assigneeName?: string;

  @ApiPropertyOptional({ description: "Organization ID" })
  organizationId?: string;

  @ApiProperty({ description: "Detection timestamp" })
  detectedAt: Date;

  @ApiPropertyOptional({ description: "Acknowledgment timestamp" })
  acknowledgedAt?: Date;

  @ApiPropertyOptional({ description: "Remediation timestamp" })
  remediatedAt?: Date;

  @ApiProperty({ description: "Created timestamp" })
  createdAt: Date;

  @ApiProperty({ description: "Updated timestamp" })
  updatedAt: Date;

  @ApiProperty({
    description: "Globally unique system record identifier (<entityType>:<entityId>)",
    example: "violation:5cbe2f8c-e10e-4dd2-b963-9d88f195db5a",
  })
  systemRecordId: string;

  @ApiProperty({
    type: TraceContext,
    description: "Trace fields used to correlate records across workflows, tasks, compliance, and audit logs",
  })
  traceContext: TraceContext;

  @ApiProperty({
    type: [RelatedRecord],
    description: "Cross-domain records related to this violation",
  })
  relatedRecords: RelatedRecord[];
}

export class ViolationListResponse {
  @ApiProperty({ type: [ViolationEntity] })
  data: ViolationEntity[];

  @ApiProperty()
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export class ViolationStats {
  @ApiProperty({ description: "Total violations" })
  total: number;

  @ApiProperty({ description: "Open violations" })
  open: number;

  @ApiProperty({ description: "Acknowledged violations" })
  acknowledged: number;

  @ApiProperty({ description: "In remediation" })
  inRemediation: number;

  @ApiProperty({ description: "Remediated violations" })
  remediated: number;

  @ApiProperty({ description: "Critical violations" })
  critical: number;

  @ApiProperty({ description: "High severity violations" })
  high: number;
}
