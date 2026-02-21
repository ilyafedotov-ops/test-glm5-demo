import { IsString, IsOptional, IsArray, IsEnum, IsUUID } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateKnowledgeArticleDto {
  @ApiProperty({ example: "How to reset password" })
  @IsString()
  title!: string;

  @ApiProperty({ example: "Step-by-step guide to reset your password..." })
  @IsString()
  content!: string;

  @ApiProperty({ enum: ["general", "howto", "troubleshooting", "reference"] })
  @IsEnum(["general", "howto", "troubleshooting", "reference"])
  category!: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];
}

export class UpdateKnowledgeArticleDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ enum: ["general", "howto", "troubleshooting", "reference"] })
  @IsOptional()
  @IsEnum(["general", "howto", "troubleshooting", "reference"])
  category?: string;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ description: "Short summary of what changed in this revision" })
  @IsOptional()
  @IsString()
  changeSummary?: string;
}

export class RevertKnowledgeArticleVersionDto {
  @ApiProperty({ description: "Version record ID to revert to" })
  @IsUUID()
  versionId!: string;

  @ApiPropertyOptional({ description: "Reason for revert operation" })
  @IsOptional()
  @IsString()
  changeSummary?: string;
}
