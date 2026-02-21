"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const tasks_service_1 = require("./tasks.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const create_task_dto_1 = require("./dto/create-task.dto");
const update_task_dto_1 = require("./dto/update-task.dto");
const task_query_dto_1 = require("./dto/task-query.dto");
const task_entity_1 = require("./entities/task.entity");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
let TasksController = class TasksController {
    tasksService;
    constructor(tasksService) {
        this.tasksService = tasksService;
    }
    async create(req, dto) {
        return this.tasksService.create(req.user.organizationId, req.user.userId, dto);
    }
    async getOptions(req) {
        return this.tasksService.getOptions(req.user.organizationId);
    }
    async findAll(req, query) {
        return this.tasksService.findAll(req.user.organizationId, query);
    }
    async getStats(req) {
        return this.tasksService.getStats(req.user.organizationId);
    }
    async findOne(id, req) {
        return this.tasksService.findOne(id, req.user.organizationId);
    }
    async update(id, req, dto) {
        return this.tasksService.update(id, req.user.organizationId, req.user.userId, dto);
    }
    async assign(id, req, dto) {
        return this.tasksService.assign(id, req.user.organizationId, req.user.userId, dto);
    }
    async start(id, req, dto) {
        return this.tasksService.start(id, req.user.organizationId, req.user.userId, dto);
    }
    async complete(id, req, dto) {
        return this.tasksService.complete(id, req.user.organizationId, req.user.userId, dto);
    }
    async reopen(id, req, dto) {
        return this.tasksService.reopen(id, req.user.organizationId, req.user.userId, dto);
    }
    async cancel(id, req, reason) {
        return this.tasksService.cancel(id, req.user.organizationId, req.user.userId, reason);
    }
    async remove(id, req) {
        return this.tasksService.remove(id, req.user.organizationId, req.user.userId);
    }
};
exports.TasksController = TasksController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new task" }),
    (0, permissions_decorator_1.RequirePermissions)("tasks:write"),
    (0, audited_decorator_1.Audited)({ action: "task.create", resource: "task", captureNewValue: true }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Task created", type: task_entity_1.TaskEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_task_dto_1.CreateTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("options"),
    (0, swagger_1.ApiOperation)({ summary: "Get task form options (users, teams)" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Options for task creation" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getOptions", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List all tasks" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of tasks" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, task_query_dto_1.TaskQueryDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("stats"),
    (0, swagger_1.ApiOperation)({ summary: "Get task statistics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Task statistics", type: task_entity_1.TaskStats }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get task by ID" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Task ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Task details", type: task_entity_1.TaskEntity }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Task not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update task" }),
    (0, permissions_decorator_1.RequirePermissions)("tasks:update"),
    (0, audited_decorator_1.Audited)({
        action: "task.update",
        resource: "task",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Task ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Task updated", type: task_entity_1.TaskEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Task not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_task_dto_1.UpdateTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/assign"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Assign task to a user" }),
    (0, permissions_decorator_1.RequirePermissions)("tasks:update"),
    (0, audited_decorator_1.Audited)({
        action: "task.assign",
        resource: "task",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Task ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Task assigned", type: task_entity_1.TaskEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid assignee" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Task or user not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_task_dto_1.AssignTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "assign", null);
__decorate([
    (0, common_1.Post)(":id/start"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Start working on a task" }),
    (0, permissions_decorator_1.RequirePermissions)("tasks:update"),
    (0, audited_decorator_1.Audited)({
        action: "task.start",
        resource: "task",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Task ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Task started", type: task_entity_1.TaskEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Cannot start task" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Task not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_task_dto_1.StartTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "start", null);
__decorate([
    (0, common_1.Post)(":id/complete"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Mark task as completed" }),
    (0, permissions_decorator_1.RequirePermissions)("tasks:update"),
    (0, audited_decorator_1.Audited)({
        action: "task.complete",
        resource: "task",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Task ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Task completed", type: task_entity_1.TaskEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Cannot complete task" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Task not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_task_dto_1.CompleteTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(":id/reopen"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Reopen a completed or cancelled task" }),
    (0, permissions_decorator_1.RequirePermissions)("tasks:update"),
    (0, audited_decorator_1.Audited)({
        action: "task.reopen",
        resource: "task",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Task ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Task reopened", type: task_entity_1.TaskEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Cannot reopen task" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Task not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_task_dto_1.ReopenTaskDto]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "reopen", null);
__decorate([
    (0, common_1.Post)(":id/cancel"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Cancel a task" }),
    (0, permissions_decorator_1.RequirePermissions)("tasks:update"),
    (0, audited_decorator_1.Audited)({
        action: "task.cancel",
        resource: "task",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Task ID" }),
    (0, swagger_1.ApiQuery)({ name: "reason", required: false, description: "Cancellation reason" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Task cancelled", type: task_entity_1.TaskEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Cannot cancel task" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Task not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)("reason")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, String]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "cancel", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "Delete a task" }),
    (0, permissions_decorator_1.RequirePermissions)("tasks:delete"),
    (0, audited_decorator_1.Audited)({ action: "task.delete", resource: "task", capturePreviousValue: true }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Task ID" }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "Task deleted" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Task not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TasksController.prototype, "remove", null);
exports.TasksController = TasksController = __decorate([
    (0, swagger_1.ApiTags)("tasks"),
    (0, common_1.Controller)("tasks"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("tasks:read"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [tasks_service_1.TasksService])
], TasksController);
//# sourceMappingURL=tasks.controller.js.map