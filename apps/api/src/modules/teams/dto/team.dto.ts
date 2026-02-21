import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsArray, IsUUID } from "class-validator";

export class CreateTeamDto {
  @ApiProperty({ description: "Team name" })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: "Team description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Initial member IDs", type: [String] })
  @IsOptional()
  @IsArray()
  @IsUUID("4", { each: true })
  memberIds?: string[];

  @ApiPropertyOptional({ description: "Team lead user ID" })
  @IsOptional()
  @IsUUID()
  leadId?: string;
}

export class UpdateTeamDto {
  @ApiPropertyOptional({ description: "Team name" })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ description: "Team description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Team lead user ID" })
  @IsOptional()
  @IsUUID()
  leadId?: string;
}

export class AddMemberDto {
  @ApiProperty({ description: "User ID to add to team" })
  @IsString()
  userId: string;
}
