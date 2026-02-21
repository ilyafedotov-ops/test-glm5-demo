import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
} from "class-validator";

export enum ItilIncidentStatus {
  NEW = "new",
  ASSIGNED = "assigned",
  IN_PROGRESS = "in_progress",
  PENDING = "pending",
  RESOLVED = "resolved",
  CLOSED = "closed",
  CANCELLED = "cancelled",
  ESCALATED = "escalated",
}

export class TransitionIncidentDto {
  @ApiProperty({ enum: ItilIncidentStatus, description: "Target status for strict transition" })
  @IsEnum(ItilIncidentStatus)
  toStatus: ItilIncidentStatus;

  @ApiPropertyOptional({ description: "Optional transition reason" })
  @IsOptional()
  @IsString()
  reason?: string;

  @ApiPropertyOptional({ description: "Optional transition comment" })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: "Assignee user ID update for this transition" })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: "Team ID update for this transition" })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ description: "Required when moving to pending" })
  @IsOptional()
  @IsString()
  pendingReason?: string;

  @ApiPropertyOptional({ description: "Optional hold-until date for pending incidents" })
  @IsOptional()
  @IsDateString()
  onHoldUntil?: string;

  @ApiPropertyOptional({ description: "Required when moving to resolved" })
  @IsOptional()
  @IsString()
  resolutionSummary?: string;

  @ApiPropertyOptional({ description: "Required when moving to closed" })
  @IsOptional()
  @IsString()
  closureCode?: string;

  @ApiPropertyOptional({ description: "Optional metadata for downstream automation" })
  @IsOptional()
  @IsObject()
  @Type(() => Object)
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: "Link to problem when resolving (Problem Management)" })
  @IsOptional()
  @IsUUID()
  problemId?: string;

  @ApiPropertyOptional({ description: "Link to knowledge article when resolving (Knowledge Management)" })
  @IsOptional()
  @IsUUID()
  knowledgeArticleId?: string;
}
