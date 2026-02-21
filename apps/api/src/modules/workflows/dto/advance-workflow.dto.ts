import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsObject } from "class-validator";

export class AdvanceWorkflowDto {
  @ApiPropertyOptional({ description: "Action to take (approve, reject, skip, retry)" })
  @IsOptional()
  @IsString()
  action?: "approve" | "reject" | "skip" | "retry";

  @ApiPropertyOptional({ description: "Comment for this action" })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({ description: "Additional data for the transition" })
  @IsOptional()
  @IsObject()
  data?: Record<string, any>;

  @ApiPropertyOptional({ description: "Next step ID to transition to (for branching workflows)" })
  @IsOptional()
  @IsString()
  nextStepId?: string;
}

export class CancelWorkflowDto {
  @ApiProperty({ description: "Reason for cancellation" })
  @IsString()
  reason: string;
}

export class RollbackWorkflowDto {
  @ApiProperty({ description: "Step ID to rollback to" })
  @IsString()
  targetStepId: string;

  @ApiPropertyOptional({ description: "Reason for rollback" })
  @IsOptional()
  @IsString()
  reason?: string;
}
