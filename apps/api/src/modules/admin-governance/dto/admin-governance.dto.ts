import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreatePrivilegedAccessRequestDto {
  @ApiProperty()
  @IsUUID()
  targetUserId!: string;

  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID("4", { each: true })
  requestedRoleIds!: string[];

  @ApiProperty()
  @IsString()
  justification!: string;
}

export class ReviewPrivilegedAccessRequestDto {
  @ApiProperty({ enum: ["approve", "reject"] })
  @IsEnum(["approve", "reject"])
  action!: "approve" | "reject";

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  comment?: string;
}

export class UpdateCabPolicyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(10)
  minimumApprovers?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  quorumPercent?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  emergencyChangeRequiresCab?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  meetingCadence?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maintenanceWindow?: string;
}

export class CabMemberInputDto {
  @ApiProperty()
  @IsUUID()
  userId!: string;

  @ApiProperty({ enum: ["chair", "member", "advisor"] })
  @IsEnum(["chair", "member", "advisor"])
  role!: "chair" | "member" | "advisor";
}

export class UpdateCabMembersDto {
  @ApiProperty({ type: [CabMemberInputDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CabMemberInputDto)
  members!: CabMemberInputDto[];
}
