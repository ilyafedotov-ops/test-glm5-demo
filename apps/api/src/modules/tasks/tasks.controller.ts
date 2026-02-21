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
  ApiQuery,
} from "@nestjs/swagger";
import { TasksService } from "./tasks.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { CreateTaskDto } from "./dto/create-task.dto";
import {
  UpdateTaskDto,
  AssignTaskDto,
  StartTaskDto,
  CompleteTaskDto,
  ReopenTaskDto,
} from "./dto/update-task.dto";
import { TaskQueryDto } from "./dto/task-query.dto";
import { TaskEntity, TaskStats } from "./entities/task.entity";
import { Audited } from "../audit/decorators/audited.decorator";

@ApiTags("tasks")
@Controller("tasks")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("tasks:read")
@ApiBearerAuth()
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @ApiOperation({ summary: "Create a new task" })
  @RequirePermissions("tasks:write")
  @Audited({ action: "task.create", resource: "task", captureNewValue: true })
  @ApiResponse({ status: 201, description: "Task created", type: TaskEntity })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async create(
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: CreateTaskDto
  ): Promise<TaskEntity> {
    return this.tasksService.create(req.user.organizationId, req.user.userId, dto);
  }

  @Get("options")
  @ApiOperation({ summary: "Get task form options (users, teams)" })
  @ApiResponse({ status: 200, description: "Options for task creation" })
  async getOptions(@Request() req: { user: { organizationId: string } }) {
    return this.tasksService.getOptions(req.user.organizationId);
  }

  @Get("options/records")
  @ApiOperation({ summary: "Search records for task linking selectors" })
  @ApiQuery({
    name: "type",
    required: true,
    enum: ["incident", "workflow", "violation", "problem", "change", "policy"],
  })
  @ApiQuery({ name: "q", required: false, description: "Search query" })
  @ApiQuery({ name: "limit", required: false, description: "Max results (1-50)" })
  @ApiResponse({ status: 200, description: "Task link record options" })
  async searchRecordOptions(
    @Request() req: { user: { organizationId: string } },
    @Query("type") type: string,
    @Query("q") q?: string,
    @Query("limit") limit?: string
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.tasksService.searchRecordOptions(
      req.user.organizationId,
      type,
      q,
      Number.isFinite(parsedLimit) ? parsedLimit : undefined
    );
  }

  @Get()
  @ApiOperation({ summary: "List all tasks" })
  @ApiResponse({ status: 200, description: "List of tasks" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @Request() req: { user: { organizationId: string } },
    @Query() query: TaskQueryDto
  ) {
    return this.tasksService.findAll(req.user.organizationId, query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get task statistics" })
  @ApiResponse({ status: 200, description: "Task statistics", type: TaskStats })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getStats(@Request() req: { user: { organizationId: string } }): Promise<TaskStats> {
    return this.tasksService.getStats(req.user.organizationId);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get task by ID" })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 200, description: "Task details", type: TaskEntity })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async findOne(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ): Promise<TaskEntity> {
    return this.tasksService.findOne(id, req.user.organizationId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update task" })
  @RequirePermissions("tasks:update")
  @Audited({
    action: "task.update",
    resource: "task",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 200, description: "Task updated", type: TaskEntity })
  @ApiResponse({ status: 400, description: "Invalid input" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async update(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: UpdateTaskDto
  ): Promise<TaskEntity> {
    return this.tasksService.update(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/assign")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Assign task to a user" })
  @RequirePermissions("tasks:update")
  @Audited({
    action: "task.assign",
    resource: "task",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 200, description: "Task assigned", type: TaskEntity })
  @ApiResponse({ status: 400, description: "Invalid assignee" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Task or user not found" })
  async assign(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: AssignTaskDto
  ): Promise<TaskEntity> {
    return this.tasksService.assign(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/start")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Start working on a task" })
  @RequirePermissions("tasks:update")
  @Audited({
    action: "task.start",
    resource: "task",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 200, description: "Task started", type: TaskEntity })
  @ApiResponse({ status: 400, description: "Cannot start task" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async start(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: StartTaskDto
  ): Promise<TaskEntity> {
    return this.tasksService.start(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/complete")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark task as completed" })
  @RequirePermissions("tasks:update")
  @Audited({
    action: "task.complete",
    resource: "task",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 200, description: "Task completed", type: TaskEntity })
  @ApiResponse({ status: 400, description: "Cannot complete task" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async complete(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: CompleteTaskDto
  ): Promise<TaskEntity> {
    return this.tasksService.complete(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/reopen")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Reopen a completed or cancelled task" })
  @RequirePermissions("tasks:update")
  @Audited({
    action: "task.reopen",
    resource: "task",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 200, description: "Task reopened", type: TaskEntity })
  @ApiResponse({ status: 400, description: "Cannot reopen task" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async reopen(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Body() dto: ReopenTaskDto
  ): Promise<TaskEntity> {
    return this.tasksService.reopen(id, req.user.organizationId, req.user.userId, dto);
  }

  @Post(":id/cancel")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Cancel a task" })
  @RequirePermissions("tasks:update")
  @Audited({
    action: "task.cancel",
    resource: "task",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiQuery({ name: "reason", required: false, description: "Cancellation reason" })
  @ApiResponse({ status: 200, description: "Task cancelled", type: TaskEntity })
  @ApiResponse({ status: 400, description: "Cannot cancel task" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async cancel(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } },
    @Query("reason") reason?: string
  ): Promise<TaskEntity> {
    return this.tasksService.cancel(id, req.user.organizationId, req.user.userId, reason);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a task" })
  @RequirePermissions("tasks:delete")
  @Audited({ action: "task.delete", resource: "task", capturePreviousValue: true })
  @ApiParam({ name: "id", description: "Task ID" })
  @ApiResponse({ status: 204, description: "Task deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Task not found" })
  async remove(
    @Param("id") id: string,
    @Request() req: { user: { userId: string; organizationId: string } }
  ): Promise<void> {
    return this.tasksService.remove(id, req.user.organizationId, req.user.userId);
  }
}
