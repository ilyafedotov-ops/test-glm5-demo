import { ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, IsEnum } from "class-validator";
import { CreateViolationDto, ViolationStatus } from "./create-violation.dto";

export class UpdateViolationDto extends PartialType(CreateViolationDto) {
  @ApiPropertyOptional({ description: "Violation status", enum: ViolationStatus })
  @IsOptional()
  @IsEnum(ViolationStatus)
  status?: ViolationStatus;
}

export class AcknowledgeViolationDto {
  @ApiPropertyOptional({ description: "Acknowledgment comment" })
  @IsOptional()
  @IsString()
  comment?: string;
}

export class RemediateViolationDto {
  @ApiPropertyOptional({ description: "Remediation details" })
  @IsString()
  remediation: string;

  @ApiPropertyOptional({ description: "Evidence of remediation" })
  @IsOptional()
  @IsString()
  evidence?: string;
}

export class AssignViolationDto {
  @ApiPropertyOptional({ description: "User ID to assign" })
  @IsUUID()
  assigneeId: string;

  @ApiPropertyOptional({ description: "Assignment note" })
  @IsOptional()
  @IsString()
  note?: string;
}
