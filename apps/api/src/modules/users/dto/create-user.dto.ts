import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsString, IsOptional, IsBoolean, IsArray } from "class-validator";

export class CreateUserDto {
  @ApiProperty({ description: "User email" })
  @IsEmail()
  email: string;

  @ApiProperty({ description: "First name" })
  @IsString()
  firstName: string;

  @ApiProperty({ description: "Last name" })
  @IsString()
  lastName: string;

  @ApiProperty({ description: "Password" })
  @IsString()
  password: string;

  @ApiPropertyOptional({ description: "Role IDs to assign", type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roleIds?: string[];
}
