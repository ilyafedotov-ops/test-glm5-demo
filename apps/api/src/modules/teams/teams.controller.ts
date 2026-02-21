import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { Audited } from "../audit/decorators/audited.decorator";
import { TeamsService } from "./teams.service";
import { CreateTeamDto, UpdateTeamDto, AddMemberDto } from "./dto/team.dto";

@ApiTags("teams")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin:all")
@Controller("teams")
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: "Get all teams in organization" })
  @ApiResponse({ status: 200, description: "List of teams" })
  async findAll(@Request() req: { user: { organizationId: string } }) {
    return this.teamsService.findAll(req.user.organizationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get team by ID" })
  @ApiResponse({ status: 200, description: "Team details" })
  @ApiResponse({ status: 404, description: "Team not found" })
  async findOne(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.teamsService.findOne(id, req.user.organizationId);
  }

  @Post()
  @ApiOperation({ summary: "Create a new team" })
  @Audited({ action: "team.create", resource: "team", captureNewValue: true })
  @ApiResponse({ status: 201, description: "Team created" })
  async create(
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() dto: CreateTeamDto
  ) {
    return this.teamsService.create(req.user.organizationId, req.user.userId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update team" })
  @Audited({
    action: "team.update",
    resource: "team",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiResponse({ status: 200, description: "Team updated" })
  async update(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } },
    @Body() dto: UpdateTeamDto
  ) {
    return this.teamsService.update(id, req.user.organizationId, dto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete team" })
  @Audited({ action: "team.delete", resource: "team", capturePreviousValue: true })
  @ApiResponse({ status: 200, description: "Team deleted" })
  async remove(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.teamsService.remove(id, req.user.organizationId);
  }

  @Get(":id/members")
  @ApiOperation({ summary: "Get team members" })
  @ApiResponse({ status: 200, description: "List of team members" })
  async getMembers(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.teamsService.getMembers(id, req.user.organizationId);
  }

  @Post(":id/members")
  @ApiOperation({ summary: "Add member to team" })
  @Audited({
    action: "team.add_member",
    resource: "team",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiResponse({ status: 200, description: "Member added" })
  async addMember(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } },
    @Body() dto: AddMemberDto
  ) {
    return this.teamsService.addMember(id, req.user.organizationId, dto);
  }

  @Delete(":id/members/:userId")
  @ApiOperation({ summary: "Remove member from team" })
  @Audited({
    action: "team.remove_member",
    resource: "team",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiResponse({ status: 200, description: "Member removed" })
  async removeMember(
    @Param("id") id: string,
    @Param("userId") userId: string,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.teamsService.removeMember(id, userId, req.user.organizationId);
  }
}
