import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { Audited } from "../audit/decorators/audited.decorator";
import { UsersService } from "./users.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { UpdateUserRolesDto } from "./dto/update-user-roles.dto";
import { CreateUserDto } from "./dto/create-user.dto";

@ApiTags("users")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin:all")
@Controller("users")
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "Get all users in organization" })
  @ApiQuery({ name: "page", required: false, type: Number })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async findAll(
    @Request() req: { user: { organizationId: string } },
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.usersService.findAll(
      req.user.organizationId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Post()
  @ApiOperation({ summary: "Create a new user" })
  @Audited({ action: "user.create", resource: "user", captureNewValue: true })
  @ApiResponse({ status: 201, description: "User created" })
  @ApiResponse({ status: 400, description: "Invalid input or email already exists" })
  async create(
    @Request() req: { user: { organizationId: string } },
    @Body() dto: CreateUserDto
  ) {
    return this.usersService.create(req.user.organizationId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get user by ID" })
  async findOne(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.usersService.findOne(id, req.user.organizationId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update user" })
  @Audited({
    action: "user.update",
    resource: "user",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.usersService.update(id, req.user.organizationId, dto);
  }

  @Patch(":id/roles")
  @ApiOperation({ summary: "Update user roles" })
  @Audited({
    action: "user.update_roles",
    resource: "user",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  async updateRoles(
    @Param("id") id: string,
    @Body() dto: UpdateUserRolesDto,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.usersService.updateRoles(id, req.user.organizationId, dto.roleIds);
  }
}
