import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsObject, IsOptional, IsString, IsUUID } from "class-validator";

export class CreateWorkflowFromTemplateDto {
  @ApiProperty({ description: "Workflow template ID from the registry" })
  @IsString()
  templateId: string;

  @ApiPropertyOptional({ description: "Override workflow display name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Entity ID this workflow targets" })
  @IsOptional()
  @IsString()
  entityId?: string;

  @ApiPropertyOptional({ description: "Entity type this workflow targets", example: "incident" })
  @IsOptional()
  @IsString()
  entityType?: string;

  @ApiPropertyOptional({ description: "Incident ID to link" })
  @IsOptional()
  @IsUUID()
  incidentId?: string;

  @ApiPropertyOptional({ description: "Additional context for template interpolation" })
  @IsOptional()
  @IsObject()
  context?: Record<string, unknown>;

  @ApiPropertyOptional({
    description: "Create correlated tasks from template steps",
    default: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  autoCreateTasks?: boolean = true;
}
