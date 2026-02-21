import { PartialType } from "@nestjs/swagger";
import { CreateIncidentDto } from "./create-incident.dto";
import { IsEnum, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";

export type IncidentStatus =
  | "open"
  | "in_progress"
  | "pending"
  | "resolved"
  | "closed"
  | "escalated";

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
  @ApiPropertyOptional({
    enum: ["open", "in_progress", "pending", "resolved", "closed", "escalated"],
  })
  @IsOptional()
  @IsEnum(["open", "in_progress", "pending", "resolved", "closed", "escalated"])
  status?: IncidentStatus;
}
