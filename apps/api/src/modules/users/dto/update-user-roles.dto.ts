import { IsArray, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class UpdateUserRolesDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  roleIds!: string[];
}
