import { ApiProperty } from "@nestjs/swagger";
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

const SLA_PRIORITIES = ["critical", "high", "medium", "low"] as const;

export class SLATargetDto {
  @ApiProperty({ enum: SLA_PRIORITIES })
  @IsEnum(SLA_PRIORITIES)
  priority!: (typeof SLA_PRIORITIES)[number];

  @ApiProperty()
  @IsInt()
  @Min(1)
  responseTimeMins!: number;

  @ApiProperty()
  @IsInt()
  @Min(1)
  resolutionTimeMins!: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  businessHoursOnly?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateSLATargetsDto {
  @ApiProperty({ type: [SLATargetDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => SLATargetDto)
  targets!: SLATargetDto[];
}
