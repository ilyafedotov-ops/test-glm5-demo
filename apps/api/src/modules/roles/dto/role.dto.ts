import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsBoolean, IsArray, IsString as IsStr } from "class-validator";

export class CreateRoleDto {
  @ApiProperty({ description: "Role name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Role description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Permission IDs to assign", type: [String] })
  @IsOptional()
  @IsArray()
  @IsStr({ each: true })
  permissionIds?: string[];
}

export class UpdateRoleDto {
  @ApiPropertyOptional({ description: "Role name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Role description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Permission IDs to assign", type: [String] })
  @IsOptional()
  @IsArray()
  @IsStr({ each: true })
  permissionIds?: string[];
}
