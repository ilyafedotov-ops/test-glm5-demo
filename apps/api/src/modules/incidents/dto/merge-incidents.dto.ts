import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, Min } from "class-validator";

export class QueryIncidentDuplicatesDto {
  @ApiPropertyOptional({ description: "Maximum number of duplicate candidates", default: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(20)
  limit?: number = 5;
}

export class MergeIncidentsDto {
  @ApiProperty({ description: "Target incident to keep" })
  @IsUUID("4")
  targetIncidentId!: string;

  @ApiProperty({ type: [String], description: "Incidents to merge into target" })
  @IsArray()
  @IsUUID("4", { each: true })
  sourceIncidentIds!: string[];

  @ApiPropertyOptional({ description: "Optional merge reason for audit trail" })
  @IsOptional()
  @IsString()
  reason?: string;
}
