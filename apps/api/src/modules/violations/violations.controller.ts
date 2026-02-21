import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { ViolationsService } from "./violations.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CreateViolationDto } from "./dto/create-violation.dto";
import { UpdateViolationDto, AcknowledgeViolationDto, RemediateViolationDto, AssignViolationDto } from "./dto/update-violation.dto";
import { ViolationQueryDto } from "./dto/violation-query.dto";
import { ViolationEntity, ViolationStats } from "./entities/violation.entity";
import { Audited } from "../audit/decorators/audited.decorator";

@ApiTags("violations")
@Controller("violations")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("violations:read")
@ApiBearerAuth()
export class ViolationsController {
  constructor(private readonly violationsService: ViolationsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new violation" })
  @RequirePermissions("violations:write")
  @Audited({ action: "violation.create", resource: "violation", captureNewValue: true })
  @ApiResponse({ status: 201, description: "Violation created", type: ViolationEntity })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Policy not found" })
  async create(
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: CreateViolationDto
  ): Promise<ViolationEntity> {
    return this.violationsService.create(req.user.organizationId, req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "List all violations" })
  @ApiResponse({ status: 200, description: "List of violations" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @Request() req: { user: { organizationId: string } },
    @Query() query: ViolationQueryDto
  ) {
    return this.violationsService.findAll(req.user.organizationId, query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get violation statistics" })
  @ApiResponse({ status: 200, description: "Violation statistics", type: ViolationStats })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getStats(
    @Request() req: { user: { organizationId: string } }
  ): Promise<ViolationStats> {
    return this.violationsService.getStats(req.user.organizationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get violation by ID" })
  @ApiParam({ name: "id", description: "Violation ID" })
  @ApiResponse({ status: 200, description: "Violation details", type: ViolationEntity })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Violation not found" })
  async findOne(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ): Promise<ViolationEntity> {
    return this.violationsService.findOne(id, req.user.organizationId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update violation" })
  @RequirePermissions("violations:update")
  @Audited({
    action: "violation.update",
    resource: "violation",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Violation ID" })
  @ApiResponse({ status: 200, description: "Violation updated", type: ViolationEntity })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Violation not found" })
  async update(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: UpdateViolationDto
  ): Promise<ViolationEntity> {
    return this.violationsService.update(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/acknowledge")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Acknowledge a violation" })
  @RequirePermissions("violations:update")
  @Audited({
    action: "violation.acknowledge",
    resource: "violation",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Violation ID" })
  @ApiResponse({ status: 200, description: "Violation acknowledged", type: ViolationEntity })
  @ApiResponse({ status: 400, description: "Cannot acknowledge" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Violation not found" })
  async acknowledge(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: AcknowledgeViolationDto
  ): Promise<ViolationEntity> {
    return this.violationsService.acknowledge(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/remediate")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark violation as remediated" })
  @RequirePermissions("violations:update")
  @Audited({
    action: "violation.remediate",
    resource: "violation",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Violation ID" })
  @ApiResponse({ status: 200, description: "Violation remediated", type: ViolationEntity })
  @ApiResponse({ status: 400, description: "Cannot remediate" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Violation not found" })
  async remediate(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: RemediateViolationDto
  ): Promise<ViolationEntity> {
    return this.violationsService.remediate(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/assign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Assign violation to a user" })
  @RequirePermissions("violations:update")
  @Audited({
    action: "violation.assign",
    resource: "violation",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Violation ID" })
  @ApiResponse({ status: 200, description: "Violation assigned", type: ViolationEntity })
  @ApiResponse({ status: 400, description: "Invalid assignee" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Violation or user not found" })
  async assign(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: AssignViolationDto
  ): Promise<ViolationEntity> {
    return this.violationsService.assign(id, req.user.organizationId, req.user.userId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a violation" })
  @RequirePermissions("violations:delete")
  @Audited({ action: "violation.delete", resource: "violation", capturePreviousValue: true })
  @ApiParam({ name: "id", description: "Violation ID" })
  @ApiResponse({ status: 204, description: "Violation deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Violation not found" })
  async remove(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } }
  ): Promise<void> {
    return this.violationsService.remove(id, req.user.organizationId, req.user.userId);
  }
}
