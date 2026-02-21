import { ApiProperty, ApiPropertyOptional, PartialType } from "@nestjs/swagger";
import { IsString, IsOptional, IsUUID, IsInt, Min } from "class-validator";
import { CreateTaskDto } from "./create-task.dto";

export class UpdateTaskDto extends PartialType(CreateTaskDto) {}

export class AssignTaskDto {
  @ApiProperty({ description: "User ID to assign", required: false })
  @IsOptional()
  @IsUUID()
  assigneeId?: string | null;
}

export class StartTaskDto {
  @ApiPropertyOptional({ description: "Note about starting the task" })
  @IsOptional()
  @IsString()
  note?: string;
}

export class CompleteTaskDto {
  @ApiPropertyOptional({ description: "Actual time spent in minutes" })
  @IsOptional()
  @IsInt()
  @Min(0)
  actualMinutes?: number;

  @ApiPropertyOptional({ description: "Completion note" })
  @IsOptional()
  @IsString()
  note?: string;
}

export class ReopenTaskDto {
  @ApiPropertyOptional({ description: "Reason for reopening" })
  @IsOptional()
  @IsString()
  reason?: string;
}
