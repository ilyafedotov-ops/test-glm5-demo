import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type ChangeType = "standard" | "normal" | "emergency";
export type ChangeStatus = "draft" | "requested" | "assessing" | "scheduled" | "approved" | "rejected" | "implementing" | "completed" | "failed";
export type RiskLevel = "low" | "medium" | "high" | "critical";
export type PirOutcome = "successful" | "partial" | "failed";

export class CreateChangeDto {
  @ApiProperty({ example: "Upgrade database server to latest version" })
  @IsString()
  title!: string;

  @ApiProperty({ example: "Detailed steps for the upgrade..." })
  @IsString()
  description!: string;

  @ApiProperty({ example: "Performance improvements and security patches" })
  @IsString()
  reason!: string;

  @ApiPropertyOptional({ enum: ["standard", "normal", "emergency"] })
  @IsOptional()
  @IsEnum(["standard", "normal", "emergency"])
  type?: ChangeType;

  @ApiPropertyOptional({ enum: ["low", "medium", "high", "critical"] })
  @IsOptional()
  @IsEnum(["low", "medium", "high", "critical"])
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ enum: ["low", "medium", "high", "critical"] })
  @IsOptional()
  @IsEnum(["low", "medium", "high", "critical"])
  impactLevel?: RiskLevel;

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
  @IsString()
  rollbackPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  testPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedEnd?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  incidentIds?: string[];
}

export class UpdateChangeDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ["draft", "requested", "assessing", "scheduled", "approved", "rejected", "implementing", "completed", "failed"] })
  @IsOptional()
  @IsEnum(["draft", "requested", "assessing", "scheduled", "approved", "rejected", "implementing", "completed", "failed"])
  status?: ChangeStatus;

  @ApiPropertyOptional({ enum: ["low", "medium", "high", "critical"] })
  @IsOptional()
  @IsEnum(["low", "medium", "high", "critical"])
  riskLevel?: RiskLevel;

  @ApiPropertyOptional({ enum: ["low", "medium", "high", "critical"] })
  @IsOptional()
  @IsEnum(["low", "medium", "high", "critical"])
  impactLevel?: RiskLevel;

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
  @IsString()
  rollbackPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  testPlan?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  plannedEnd?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualStart?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  actualEnd?: string;
}

export class CompleteChangeDto {
  @ApiProperty({ description: "Post-implementation review summary" })
  @IsString()
  pirSummary!: string;

  @ApiProperty({ enum: ["successful", "partial", "failed"] })
  @IsEnum(["successful", "partial", "failed"])
  pirOutcome!: PirOutcome;
}
