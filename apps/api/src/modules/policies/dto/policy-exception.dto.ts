import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsDateString, IsOptional, IsString, MaxLength } from "class-validator";

export class CreatePolicyExceptionDto {
  @ApiProperty({ description: "Short title for the policy exception" })
  @IsString()
  @MaxLength(255)
  title!: string;

  @ApiProperty({ description: "Business and technical justification" })
  @IsString()
  justification!: string;

  @ApiPropertyOptional({ description: "Optional expiration date for the exception" })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class ReviewPolicyExceptionDto {
  @ApiPropertyOptional({ description: "Approval/rejection note" })
  @IsOptional()
  @IsString()
  note?: string;
}
