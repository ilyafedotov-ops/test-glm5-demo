import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { ActivitiesService } from "./activities.service";

@ApiTags("activities")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("activities:read")
@Controller("activities")
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @Get()
  @ApiOperation({ summary: "Get all activities for organization" })
  @ApiQuery({ name: "entityType", required: false })
  @ApiQuery({ name: "entityId", required: false })
  @ApiQuery({ name: "actorId", required: false })
  @ApiQuery({ name: "action", required: false })
  @ApiQuery({ name: "search", required: false })
  @ApiQuery({ name: "from", required: false })
  @ApiQuery({ name: "to", required: false })
  @ApiQuery({ name: "limit", required: false, type: Number })
  @ApiQuery({ name: "offset", required: false, type: Number })
  async findAll(
    @Request() req: { user: { organizationId: string } },
    @Query("entityType") entityType?: string,
    @Query("entityId") entityId?: string,
    @Query("actorId") actorId?: string,
    @Query("action") action?: string,
    @Query("search") search?: string,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("limit") limit?: string,
    @Query("offset") offset?: string
  ) {
    return this.activitiesService.findAll(req.user.organizationId, {
      entityType,
      entityId,
      actorId,
      action,
      search,
      from,
      to,
      limit: limit ? parseInt(limit) : 50,
      offset: offset ? parseInt(offset) : 0,
    });
  }

  @Get("recent")
  @ApiOperation({ summary: "Get recent activity feed" })
  @ApiQuery({ name: "limit", required: false, type: Number })
  async getRecent(
    @Request() req: { user: { organizationId: string } },
    @Query("limit") limit?: string
  ) {
    return this.activitiesService.getRecentActivity(
      req.user.organizationId,
      limit ? parseInt(limit) : 20
    );
  }

  @Get("timeline/:entityType/:entityId")
  @ApiOperation({ summary: "Get activity timeline for an entity" })
  async getTimeline(
    @Request() req: { user: { organizationId: string } },
    @Param("entityType") entityType: string,
    @Param("entityId") entityId: string
  ) {
    return this.activitiesService.getEntityTimeline(
      req.user.organizationId,
      entityType,
      entityId
    );
  }
}
