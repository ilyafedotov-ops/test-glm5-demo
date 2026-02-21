import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { ChangesService } from "./changes.service";
import { CompleteChangeDto, CreateChangeDto, UpdateChangeDto } from "./dto/create-change.dto";
import { Audited } from "../audit/decorators/audited.decorator";

@ApiTags("changes")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("changes:read")
@Controller("changes")
export class ChangesController {
  constructor(private readonly changesService: ChangesService) {}

  @Post()
  @ApiOperation({ summary: "Create a new change request" })
  @RequirePermissions("changes:write")
  @Audited({ action: "change.create", resource: "changeRequest", captureNewValue: true })
  create(@Request() req: any, @Body() dto: CreateChangeDto) {
    return this.changesService.create(
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Get()
  @ApiOperation({ summary: "List all change requests" })
  findAll(@Request() req: any, @Query() query: any) {
    return this.changesService.findAll(req.user.organizationId, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get change request details" })
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.changesService.findOne(req.user.organizationId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update change request" })
  @RequirePermissions("changes:update")
  @Audited({
    action: "change.update",
    resource: "changeRequest",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateChangeDto
  ) {
    return this.changesService.update(
      req.user.organizationId,
      id,
      req.user.userId,
      dto
    );
  }

  @Post(":id/submit")
  @ApiOperation({ summary: "Submit change for approval" })
  @RequirePermissions("changes:update")
  @Audited({
    action: "change.submit",
    resource: "changeRequest",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  submitForApproval(@Request() req: any, @Param("id") id: string) {
    return this.changesService.submitForApproval(
      req.user.organizationId,
      id,
      req.user.userId
    );
  }

  @Post(":id/approve")
  @ApiOperation({ summary: "Approve change request" })
  @RequirePermissions("changes:update")
  @Audited({
    action: "change.approve",
    resource: "changeRequest",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  approve(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: { comments?: string }
  ) {
    return this.changesService.approve(
      req.user.organizationId,
      id,
      req.user.userId,
      body.comments
    );
  }

  @Post(":id/reject")
  @ApiOperation({ summary: "Reject change request" })
  @RequirePermissions("changes:update")
  @Audited({
    action: "change.reject",
    resource: "changeRequest",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  reject(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: { reason: string }
  ) {
    return this.changesService.reject(
      req.user.organizationId,
      id,
      req.user.userId,
      body.reason
    );
  }

  @Post(":id/implement")
  @ApiOperation({ summary: "Start implementation" })
  @RequirePermissions("changes:update")
  @Audited({
    action: "change.implement",
    resource: "changeRequest",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  startImplementation(@Request() req: any, @Param("id") id: string) {
    return this.changesService.startImplementation(
      req.user.organizationId,
      id,
      req.user.userId
    );
  }

  @Post(":id/complete")
  @ApiOperation({ summary: "Mark change as completed" })
  @RequirePermissions("changes:update")
  @Audited({
    action: "change.complete",
    resource: "changeRequest",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  complete(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: CompleteChangeDto
  ) {
    return this.changesService.complete(
      req.user.organizationId,
      id,
      req.user.userId,
      body
    );
  }

  @Post(":id/tasks")
  @ApiOperation({ summary: "Add task to change" })
  @RequirePermissions("changes:update")
  @Audited({ action: "change.add_task", resource: "changeRequest", captureNewValue: true })
  addTask(
    @Request() req: any,
    @Param("id") id: string,
    @Body() data: { title: string; description?: string; assigneeId?: string }
  ) {
    return this.changesService.addTask(
      req.user.organizationId,
      id,
      req.user.userId,
      data
    );
  }
}
