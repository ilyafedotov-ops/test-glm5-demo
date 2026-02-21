import { IsString, IsOptional, IsBoolean, IsEnum, IsUUID, IsObject } from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class CreateServiceItemDto {
  @ApiProperty({ example: "New Laptop" })
  @IsString()
  name!: string;

  @ApiProperty({ example: "Standard company laptop for employees" })
  @IsString()
  description!: string;

  @ApiProperty({ enum: ["hardware", "software", "access", "general"] })
  @IsEnum(["hardware", "software", "access", "general"])
  category!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  formSchema?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  approvalRequired?: boolean;
}

export class CreateServiceRequestDto {
  @ApiProperty()
  @IsUUID()
  serviceItemId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  formData?: any;
}

export class ApproveServiceRequestDto {
  @ApiPropertyOptional({ description: "Optional approval notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class RejectServiceRequestDto {
  @ApiPropertyOptional({ description: "Optional rejection reason" })
  @IsOptional()
  @IsString()
  reason?: string;
}

export class FulfillServiceRequestDto {
  @ApiPropertyOptional({ description: "Optional fulfillment notes" })
  @IsOptional()
  @IsString()
  notes?: string;
}
