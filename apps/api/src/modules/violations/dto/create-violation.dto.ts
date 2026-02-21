import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, IsUUID, IsObject, MaxLength } from "class-validator";

export enum ViolationSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

export enum ViolationStatus {
  OPEN = "open",
  ACKNOWLEDGED = "acknowledged",
  IN_REMEDIATION = "in_remediation",
  REMEDIATED = "remediated",
  CLOSED = "closed",
  FALSE_POSITIVE = "false_positive",
}

export class CreateViolationDto {
  @ApiProperty({ description: "Policy ID that was violated" })
  @IsUUID()
  policyId: string;

  @ApiProperty({ description: "Entity ID where violation occurred" })
  @IsString()
  entityId: string;

  @ApiProperty({ description: "Entity type (e.g., incident, user, system)" })
  @IsString()
  entityType: string;

  @ApiPropertyOptional({ description: "Violation severity", enum: ViolationSeverity, default: ViolationSeverity.MEDIUM })
  @IsOptional()
  @IsEnum(ViolationSeverity)
  severity?: ViolationSeverity;

  @ApiProperty({ description: "Violation title" })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: "Detailed description of the violation" })
  @IsString()
  description: string;

  @ApiPropertyOptional({ description: "Remediation steps" })
  @IsOptional()
  @IsString()
  remediation?: string;

  @ApiPropertyOptional({ description: "Assignee user ID" })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
