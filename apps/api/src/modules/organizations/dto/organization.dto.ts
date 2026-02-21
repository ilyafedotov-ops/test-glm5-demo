import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsObject } from "class-validator";

export class UpdateOrganizationDto {
  @ApiPropertyOptional({ description: "Organization name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Organization settings" })
  @IsOptional()
  @IsObject()
  settings?: Record<string, any>;
}
