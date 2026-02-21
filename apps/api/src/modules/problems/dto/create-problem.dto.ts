import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsBoolean, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type ProblemStatus = "new" | "investigating" | "known_error" | "root_cause_identified" | "resolved" | "closed";
export type PriorityLevel = "critical" | "high" | "medium" | "low";

export class CreateProblemDto {
  @ApiProperty({ example: "Database connectivity issues in production" })
  @IsString()
  title!: string;

  @ApiProperty({ example: "Multiple incidents reported..." })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: ["critical", "high", "medium", "low"] })
  @IsOptional()
  @IsEnum(["critical", "high", "medium", "low"])
  priority?: PriorityLevel;

  @ApiPropertyOptional({ enum: ["critical", "high", "medium", "low"] })
  @IsOptional()
  @IsEnum(["critical", "high", "medium", "low"])
  impact?: PriorityLevel;

  @ApiPropertyOptional({ enum: ["critical", "high", "medium", "low"] })
  @IsOptional()
  @IsEnum(["critical", "high", "medium", "low"])
  urgency?: PriorityLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  incidentIds?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isKnownError?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workaround?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  detectedAt?: string;
}

export class UpdateProblemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ["new", "investigating", "known_error", "root_cause_identified", "resolved", "closed"] })
  @IsOptional()
  @IsEnum(["new", "investigating", "known_error", "root_cause_identified", "resolved", "closed"])
  status?: ProblemStatus;

  @ApiPropertyOptional({ enum: ["critical", "high", "medium", "low"] })
  @IsOptional()
  @IsEnum(["critical", "high", "medium", "low"])
  priority?: PriorityLevel;

  @ApiPropertyOptional({ enum: ["critical", "high", "medium", "low"] })
  @IsOptional()
  @IsEnum(["critical", "high", "medium", "low"])
  impact?: PriorityLevel;

  @ApiPropertyOptional({ enum: ["critical", "high", "medium", "low"] })
  @IsOptional()
  @IsEnum(["critical", "high", "medium", "low"])
  urgency?: PriorityLevel;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isKnownError?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  rootCause?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  workaround?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  impactAssessment?: string;
}
