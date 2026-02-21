import { IsString, IsOptional, IsInt, Min, IsDateString } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePolicyDto {
  @ApiProperty({ example: "Security Incident Response" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "Policy defining response procedures..." })
  @IsString()
  description!: string;

  @ApiProperty({ example: "Security" })
  @IsString()
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  version?: string;

  @ApiPropertyOptional({ enum: ["draft", "active", "deprecated", "archived"] })
  @IsOptional()
  @IsString()
  status?: "draft" | "active" | "deprecated" | "archived";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerRoleId?: string;

  @ApiPropertyOptional({ default: 90 })
  @IsOptional()
  @IsInt()
  @Min(1)
  reviewFrequencyDays?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  nextReviewAt?: string;

  @ApiPropertyOptional({ description: "Policy effective date/time (ISO 8601)" })
  @IsOptional()
  @IsDateString()
  effectiveFrom?: string;
}
