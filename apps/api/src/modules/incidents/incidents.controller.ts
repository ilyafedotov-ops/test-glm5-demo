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
  HttpCode,
  HttpStatus,
  Res,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { IncidentsService } from "./incidents.service";
import { CreateIncidentDto } from "./dto/create-incident.dto";
import { UpdateIncidentDto } from "./dto/update-incident.dto";
import { QueryIncidentsDto } from "./dto/query-incidents.dto";
import { TransitionIncidentDto } from "./dto/transition-incident.dto";
import { MergeIncidentsDto, QueryIncidentDuplicatesDto } from "./dto/merge-incidents.dto";
import { ExportService } from "../export/export.service";
import { Audited } from "../audit/decorators/audited.decorator";

@ApiTags("incidents")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("incidents:read")
@Controller("incidents")
export class IncidentsController {
  constructor(
    private incidentsService: IncidentsService,
    private exportService: ExportService
  ) {}

  @Get()
  @ApiOperation({ summary: "Get all incidents with filtering" })
  async findAll(
    @Request() req: { user: { organizationId: string } },
    @Query() query: QueryIncidentsDto
  ) {
    return this.incidentsService.findAll(req.user.organizationId, query);
  }

  @Post()
  @ApiOperation({ summary: "Create a new incident" })
  @RequirePermissions("incidents:write")
  @Audited({ action: "incident.create", resource: "incident", captureNewValue: true })
  async create(
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() dto: CreateIncidentDto
  ) {
    return this.incidentsService.create(
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Get("options")
  @ApiOperation({ summary: "Get incident form options (categories, channels, transition codes)" })
  async getOptions(
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.incidentsService.getOptions(req.user.organizationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get incident by ID" })
  async findOne(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.incidentsService.findOne(id, req.user.organizationId);
  }

  @Get(":id/duplicates")
  @ApiOperation({ summary: "Find potential duplicate incidents for a given incident" })
  async findDuplicates(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } },
    @Query() query: QueryIncidentDuplicatesDto
  ) {
    return this.incidentsService.findPotentialDuplicates(
      req.user.organizationId,
      id,
      query.limit
    );
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update incident" })
  @RequirePermissions("incidents:update")
  @Audited({
    action: "incident.update",
    resource: "incident",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  async update(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } },
    @Body() dto: UpdateIncidentDto
  ) {
    return this.incidentsService.update(id, req.user.organizationId, dto);
  }

  @Post(":id/transition")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Strict ITIL incident transition with gate checks" })
  @RequirePermissions("incidents:update")
  @Audited({
    action: "incident.transition",
    resource: "incident",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  async transition(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() dto: TransitionIncidentDto
  ) {
    return this.incidentsService.transitionStrict(
      id,
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Post(":id/comments")
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: "Add comment to incident" })
  @RequirePermissions("incidents:update")
  @Audited({ action: "incident.comment", resource: "incident", captureNewValue: true })
  async addComment(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() body: { content: string; isInternal?: boolean }
  ) {
    return this.incidentsService.addComment(
      id,
      req.user.organizationId,
      req.user.userId,
      body.content,
      body.isInternal
    );
  }

  @Post("merge")
  @ApiOperation({ summary: "Merge duplicate incidents into a target incident" })
  @RequirePermissions("incidents:update")
  @Audited({
    action: "incident.merge",
    resource: "incident",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  async mergeIncidents(
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() dto: MergeIncidentsDto
  ) {
    return this.incidentsService.mergeIncidents(
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Get("export/csv")
  @ApiOperation({ summary: "Export incidents to CSV" })
  async exportCSV(
    @Request() req: { user: { organizationId: string } },
    @Query() query: QueryIncidentsDto,
    @Res() res: Response
  ) {
    const { data } = await this.incidentsService.findAll(
      req.user.organizationId,
      { ...query, limit: 1000 } // Limit export size
    );

    const fields = [
      "ticketNumber",
      "title",
      "status",
      "priority",
      "impact",
      "urgency",
      "channel",
      "createdAt",
      "resolvedAt",
      "assignee.firstName",
      "assignee.lastName",
    ];

    const csv = this.exportService.toCSV(data, fields);
    const filename = this.exportService.formatExportFilename("incidents");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }
}
