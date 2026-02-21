import { IsString, IsOptional, IsEnum, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export const REPORT_TYPES = [
  "incident_summary",
  "sla_compliance",
  "user_activity",
  "audit_log",
  "itil_kpi",
  "incident_lifecycle",
  "workflow_kpi",
] as const;

export type ReportType = (typeof REPORT_TYPES)[number];

export class RunReportDto {
  @ApiProperty({ enum: REPORT_TYPES })
  @IsString()
  @IsEnum(REPORT_TYPES)
  type!: ReportType;

  @ApiPropertyOptional({ enum: ["csv", "json"] })
  @IsOptional()
  @IsEnum(["csv", "json"])
  format?: "csv" | "json";

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  parameters?: Record<string, unknown>;

  @ApiPropertyOptional({ enum: ["none", "daily", "weekly", "monthly"] })
  @IsOptional()
  @IsEnum(["none", "daily", "weekly", "monthly"])
  scheduleFrequency?: "none" | "daily" | "weekly" | "monthly";

  @ApiPropertyOptional({ description: "Optional ISO datetime when schedule becomes active" })
  @IsOptional()
  @IsString()
  scheduleStartAt?: string;
}
