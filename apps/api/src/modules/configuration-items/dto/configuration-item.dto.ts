import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import {
  IsArray,
  IsEnum,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const CONFIGURATION_ITEM_TYPES = [
  "application",
  "service",
  "database",
  "infrastructure",
  "endpoint",
  "other",
] as const;

const CONFIGURATION_ITEM_STATUSES = ["active", "maintenance", "retired"] as const;
const CONFIGURATION_ITEM_CRITICALITY = ["low", "medium", "high", "critical"] as const;
const CONFIGURATION_ITEM_RELATIONSHIP_TYPES = [
  "depends_on",
  "hosted_on",
  "connects_to",
  "parent_of",
  "child_of",
] as const;

export type ConfigurationItemType = (typeof CONFIGURATION_ITEM_TYPES)[number];
export type ConfigurationItemStatus = (typeof CONFIGURATION_ITEM_STATUSES)[number];
export type ConfigurationItemCriticality = (typeof CONFIGURATION_ITEM_CRITICALITY)[number];
export type ConfigurationItemRelationshipType =
  (typeof CONFIGURATION_ITEM_RELATIONSHIP_TYPES)[number];

export class CreateConfigurationItemDto {
  @ApiProperty({ description: "Configuration item name", example: "Payments API" })
  @IsString()
  @MaxLength(255)
  name!: string;

  @ApiPropertyOptional({ enum: CONFIGURATION_ITEM_TYPES })
  @IsOptional()
  @IsEnum(CONFIGURATION_ITEM_TYPES)
  type?: ConfigurationItemType;

  @ApiPropertyOptional({ enum: CONFIGURATION_ITEM_STATUSES })
  @IsOptional()
  @IsEnum(CONFIGURATION_ITEM_STATUSES)
  status?: ConfigurationItemStatus;

  @ApiPropertyOptional({ enum: CONFIGURATION_ITEM_CRITICALITY })
  @IsOptional()
  @IsEnum(CONFIGURATION_ITEM_CRITICALITY)
  criticality?: ConfigurationItemCriticality;

  @ApiPropertyOptional({ description: "Target environment", example: "production" })
  @IsOptional()
  @IsString()
  environment?: string;

  @ApiPropertyOptional({ description: "Owning team", example: "Platform Engineering" })
  @IsOptional()
  @IsString()
  ownerTeam?: string;

  @ApiPropertyOptional({ description: "Configuration item description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: "Additional metadata as JSON object" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;
}

export class UpdateConfigurationItemDto extends PartialType(CreateConfigurationItemDto) {}

export class QueryConfigurationItemsDto {
  @ApiPropertyOptional({ description: "Filter by type", enum: CONFIGURATION_ITEM_TYPES })
  @IsOptional()
  @IsEnum(CONFIGURATION_ITEM_TYPES)
  type?: ConfigurationItemType;

  @ApiPropertyOptional({ description: "Filter by status", enum: CONFIGURATION_ITEM_STATUSES })
  @IsOptional()
  @IsEnum(CONFIGURATION_ITEM_STATUSES)
  status?: ConfigurationItemStatus;

  @ApiPropertyOptional({ description: "Search by name", example: "payments" })
  @IsOptional()
  @IsString()
  search?: string;
}

export class LinkConfigurationItemsDto {
  @ApiProperty({ type: [String], description: "Configuration item IDs to link to incident" })
  @IsArray()
  @IsUUID("4", { each: true })
  configurationItemIds!: string[];
}

export class ConfigurationItemRelationshipDto {
  @ApiProperty({ description: "Target configuration item ID" })
  @IsUUID("4")
  targetConfigurationItemId!: string;

  @ApiProperty({ enum: CONFIGURATION_ITEM_RELATIONSHIP_TYPES })
  @IsIn(CONFIGURATION_ITEM_RELATIONSHIP_TYPES)
  relationshipType!: ConfigurationItemRelationshipType;

  @ApiPropertyOptional({ description: "Optional relationship note" })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}

export class UpdateConfigurationItemRelationshipsDto {
  @ApiProperty({ type: [ConfigurationItemRelationshipDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ConfigurationItemRelationshipDto)
  relationships!: ConfigurationItemRelationshipDto[];
}
