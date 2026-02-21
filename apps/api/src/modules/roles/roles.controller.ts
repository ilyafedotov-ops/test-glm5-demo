import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { Audited } from "../audit/decorators/audited.decorator";
import { RolesService } from "./roles.service";
import { CreateRoleDto, UpdateRoleDto } from "./dto/role.dto";

@ApiTags("roles")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin:all")
@Controller("roles")
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: "Get all roles" })
  @ApiResponse({ status: 200, description: "List of roles" })
  async findAll() {
    return this.rolesService.findAll();
  }

  @Get("permissions")
  @ApiOperation({ summary: "Get all available permissions" })
  @ApiResponse({ status: 200, description: "List of permissions" })
  async getPermissions() {
    return this.rolesService.getPermissions();
  }

  @Get(":id")
  @ApiOperation({ summary: "Get role by ID" })
  @ApiResponse({ status: 200, description: "Role details" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async findOne(@Param("id") id: string) {
    return this.rolesService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "Create a new role" })
  @Audited({ action: "role.create", resource: "role", captureNewValue: true })
  @ApiResponse({ status: 201, description: "Role created" })
  @ApiResponse({ status: 400, description: "Invalid input" })
  async create(@Body() dto: CreateRoleDto) {
    return this.rolesService.create(dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update role" })
  @Audited({
    action: "role.update",
    resource: "role",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiResponse({ status: 200, description: "Role updated" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async update(@Param("id") id: string, @Body() dto: UpdateRoleDto) {
    return this.rolesService.update(id, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete role" })
  @Audited({ action: "role.delete", resource: "role", capturePreviousValue: true })
  @ApiResponse({ status: 200, description: "Role deleted" })
  @ApiResponse({ status: 404, description: "Role not found" })
  async remove(@Param("id") id: string) {
    return this.rolesService.remove(id);
  }
}
