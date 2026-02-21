import {
  Controller,
  Get,
  Post,
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
import { WorkflowsService } from "./workflows.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CreateWorkflowDto } from "./dto/create-workflow.dto";
import { AdvanceWorkflowDto, CancelWorkflowDto, RollbackWorkflowDto } from "./dto/advance-workflow.dto";
import { WorkflowQueryDto } from "./dto/workflow-query.dto";
import { WorkflowEntity } from "./entities/workflow.entity";
import { CreateWorkflowFromTemplateDto } from "./dto/create-workflow-from-template.dto";
import { Audited } from "../audit/decorators/audited.decorator";

@ApiTags("workflows")
@Controller("workflows")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("workflows:read")
@ApiBearerAuth()
export class WorkflowsController {
  constructor(private readonly workflowsService: WorkflowsService) {}

  @Get("templates")
  @ApiOperation({ summary: "List workflow templates in the registry" })
  @ApiResponse({ status: 200, description: "List of workflow templates" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async listTemplates(@Query("caseType") caseType?: string) {
    return this.workflowsService.listTemplates(caseType);
  }

  @Post("from-template")
  @ApiOperation({ summary: "Create workflow from a template ID" })
  @RequirePermissions("workflows:write")
  @Audited({ action: "workflow.create_from_template", resource: "workflow", captureNewValue: true })
  @ApiResponse({ status: 201, description: "Workflow created from template", type: WorkflowEntity })
  @ApiResponse({ status: 400, description: "Invalid template or input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async createFromTemplate(
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: CreateWorkflowFromTemplateDto
  ): Promise<WorkflowEntity> {
    return this.workflowsService.createFromTemplate(
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Post()
  @ApiOperation({ summary: "Create a new workflow" })
  @RequirePermissions("workflows:write")
  @Audited({ action: "workflow.create", resource: "workflow", captureNewValue: true })
  @ApiResponse({ status: 201, description: "Workflow created", type: WorkflowEntity })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: CreateWorkflowDto
  ): Promise<WorkflowEntity> {
    return this.workflowsService.create(req.user.organizationId, req.user.userId, dto);
  }

  @Get()
  @ApiOperation({ summary: "List all workflows" })
  @ApiResponse({ status: 200, description: "List of workflows" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @Request() req: { user: { organizationId: string } },
    @Query() query: WorkflowQueryDto
  ) {
    return this.workflowsService.findAll(req.user.organizationId, query);
  }

  @Get("exception-analytics")
  @ApiOperation({ summary: "Get workflow exception and retry analytics" })
  @ApiResponse({ status: 200, description: "Workflow exception analytics" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getExceptionAnalytics(
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.workflowsService.getExceptionAnalytics(req.user.organizationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get workflow by ID" })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiResponse({ status: 200, description: "Workflow details", type: WorkflowEntity })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async findOne(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ): Promise<WorkflowEntity> {
    return this.workflowsService.findOne(id, req.user.organizationId);
  }

  @Post(":id/advance")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Advance workflow to next step" })
  @RequirePermissions("workflows:update")
  @Audited({
    action: "workflow.advance",
    resource: "workflow",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiResponse({ status: 200, description: "Workflow advanced", type: WorkflowEntity })
  @ApiResponse({ status: 400, description: "Invalid action or workflow state" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async advance(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: AdvanceWorkflowDto
  ): Promise<WorkflowEntity> {
    return this.workflowsService.advance(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a workflow" })
  @RequirePermissions("workflows:update")
  @Audited({
    action: "workflow.cancel",
    resource: "workflow",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiResponse({ status: 200, description: "Workflow cancelled", type: WorkflowEntity })
  @ApiResponse({ status: 400, description: "Cannot cancel workflow" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async cancel(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: CancelWorkflowDto
  ): Promise<WorkflowEntity> {
    return this.workflowsService.cancel(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/rollback")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Rollback workflow to a previous step" })
  @RequirePermissions("workflows:update")
  @Audited({
    action: "workflow.rollback",
    resource: "workflow",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiResponse({ status: 200, description: "Workflow rolled back", type: WorkflowEntity })
  @ApiResponse({ status: 400, description: "Cannot rollback workflow" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async rollback(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: RollbackWorkflowDto
  ): Promise<WorkflowEntity> {
    return this.workflowsService.rollback(id, req.user.organizationId, req.user.userId, dto);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a workflow" })
  @RequirePermissions("workflows:delete")
  @Audited({ action: "workflow.delete", resource: "workflow", capturePreviousValue: true })
  @ApiParam({ name: "id", description: "Workflow ID" })
  @ApiResponse({ status: 204, description: "Workflow deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Workflow not found" })
  async remove(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } }
  ): Promise<void> {
    return this.workflowsService.remove(id, req.user.organizationId, req.user.userId);
  }
}
