import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class TraceContext {
  @ApiProperty({
    description: "Globally unique system record identifier (<entityType>:<entityId>)",
    example: "task:7f96f9d2-08e1-4f57-bd47-44918cc32296",
  })
  systemRecordId: string;

  @ApiPropertyOptional({ description: "Request correlation ID shared across related operations" })
  correlationId?: string;

  @ApiPropertyOptional({ description: "Parent action/event ID that caused this record change" })
  causationId?: string;

  @ApiPropertyOptional({ description: "Distributed tracing ID, if available" })
  traceId?: string;
}

export class RelatedRecord {
  @ApiProperty({ description: "Related entity type", example: "workflow" })
  type: string;

  @ApiProperty({ description: "Related entity ID" })
  id: string;

  @ApiProperty({
    description: "Globally unique related record identifier (<entityType>:<entityId>)",
    example: "workflow:8e8d4efa-4d8f-43fd-9ebf-4f3e06cf60e4",
  })
  systemRecordId: string;

  @ApiPropertyOptional({ description: "Meaning of the relationship" })
  relationship?: string;
}

type LinkValueSource = Record<string, unknown> | null | undefined;

function getStringValue(source: LinkValueSource, key: string): string | undefined {
  if (!source) {
    return undefined;
  }
  const value = source[key];
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

export function toSystemRecordId(entityType: string, entityId?: string | null): string {
  const normalizedType = entityType?.trim().toLowerCase() || "entity";
  const normalizedId = entityId?.trim() || "unknown";
  return `${normalizedType}:${normalizedId}`;
}

export function parseSystemRecordId(systemRecordId?: string | null): { type: string; id: string } | null {
  if (!systemRecordId) {
    return null;
  }
  const separatorIndex = systemRecordId.indexOf(":");
  if (separatorIndex <= 0 || separatorIndex >= systemRecordId.length - 1) {
    return null;
  }

  const type = systemRecordId.slice(0, separatorIndex).trim().toLowerCase();
  const id = systemRecordId.slice(separatorIndex + 1).trim();

  if (!type || !id) {
    return null;
  }

  return { type, id };
}

export function toTraceContext(
  systemRecordId: string,
  ...sources: LinkValueSource[]
): TraceContext {
  const correlationId = sources
    .map((source) => getStringValue(source, "correlationId"))
    .find(Boolean);
  const causationId = sources
    .map((source) => getStringValue(source, "causationId"))
    .find(Boolean);
  const traceId = sources
    .map((source) => getStringValue(source, "traceId"))
    .find(Boolean);

  return {
    systemRecordId,
    correlationId,
    causationId,
    traceId,
  };
}

interface RelatedRecordInput {
  type: string;
  id?: string | null;
  relationship?: string;
}

export function buildRelatedRecords(records: RelatedRecordInput[]): RelatedRecord[] {
  const unique = new Map<string, RelatedRecord>();

  for (const record of records) {
    if (!record.id) {
      continue;
    }
    const systemRecordId = toSystemRecordId(record.type, record.id);
    const dedupeKey = `${record.relationship || ""}|${systemRecordId}`;
    if (!unique.has(dedupeKey)) {
      unique.set(dedupeKey, {
        type: record.type,
        id: record.id,
        systemRecordId,
        relationship: record.relationship,
      });
    }
  }

  return Array.from(unique.values());
}
