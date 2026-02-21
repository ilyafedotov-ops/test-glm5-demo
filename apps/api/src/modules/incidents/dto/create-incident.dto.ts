import { IsString, IsOptional, IsEnum, IsArray, IsDateString, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type IncidentPriority = "critical" | "high" | "medium" | "low";
export type ImpactLevel = "critical" | "high" | "medium" | "low";
export type UrgencyLevel = "critical" | "high" | "medium" | "low";
export type IncidentChannel = "portal" | "email" | "phone" | "chat" | "api";

export class CreateIncidentDto {
  @ApiProperty({ example: "Production API latency spike" })
  @IsString()
  title!: string;

  @ApiProperty({ example: "Users reporting 5+ second response times..." })
  @IsString()
  description!: string;

  @ApiPropertyOptional({ enum: ["critical", "high", "medium", "low"], description: "Priority (calculated from impact x urgency if both provided)" })
  @IsOptional()
  @IsEnum(["critical", "high", "medium", "low"])
  priority?: IncidentPriority;

  @ApiPropertyOptional({ enum: ["critical", "high", "medium", "low"], description: "Impact level for priority matrix" })
  @IsOptional()
  @IsEnum(["critical", "high", "medium", "low"])
  impact?: ImpactLevel;

  @ApiPropertyOptional({ enum: ["critical", "high", "medium", "low"], description: "Urgency level for priority matrix" })
  @IsOptional()
  @IsEnum(["critical", "high", "medium", "low"])
  urgency?: UrgencyLevel;

  @ApiPropertyOptional({ description: "Incident category ID" })
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ description: "Team ID to assign" })
  @IsOptional()
  @IsUUID()
  teamId?: string;

  @ApiPropertyOptional({ description: "Assignee user ID" })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;

  @ApiPropertyOptional({ enum: ["portal", "email", "phone", "chat", "api"], description: "Channel through which incident was reported" })
  @IsOptional()
  @IsEnum(["portal", "email", "phone", "chat", "api"])
  channel?: IncidentChannel;

  @ApiPropertyOptional({ type: [String], description: "Tags for categorization" })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @ApiPropertyOptional({ description: "Due date (ISO string)" })
  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @ApiPropertyOptional({ type: [String], description: "Configuration Item IDs affected" })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  configurationItemIds?: string[];

  @ApiPropertyOptional({ description: "Link to existing problem (if creating from known error context)" })
  @IsOptional()
  @IsUUID()
  problemId?: string;

  @ApiPropertyOptional({ description: "Mark as major incident for high-impact events" })
  @IsOptional()
  isMajorIncident?: boolean;
}
