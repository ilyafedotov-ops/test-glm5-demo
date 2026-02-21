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
exports.WorkflowsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const workflows_service_1 = require("./workflows.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const create_workflow_dto_1 = require("./dto/create-workflow.dto");
const advance_workflow_dto_1 = require("./dto/advance-workflow.dto");
const workflow_query_dto_1 = require("./dto/workflow-query.dto");
const workflow_entity_1 = require("./entities/workflow.entity");
const create_workflow_from_template_dto_1 = require("./dto/create-workflow-from-template.dto");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
let WorkflowsController = class WorkflowsController {
    workflowsService;
    constructor(workflowsService) {
        this.workflowsService = workflowsService;
    }
    async listTemplates(caseType) {
        return this.workflowsService.listTemplates(caseType);
    }
    async createFromTemplate(req, dto) {
        return this.workflowsService.createFromTemplate(req.user.organizationId, req.user.userId, dto);
    }
    async create(req, dto) {
        return this.workflowsService.create(req.user.organizationId, req.user.userId, dto);
    }
    async findAll(req, query) {
        return this.workflowsService.findAll(req.user.organizationId, query);
    }
    async getExceptionAnalytics(req) {
        return this.workflowsService.getExceptionAnalytics(req.user.organizationId);
    }
    async findOne(id, req) {
        return this.workflowsService.findOne(id, req.user.organizationId);
    }
    async advance(id, req, dto) {
        return this.workflowsService.advance(id, req.user.organizationId, req.user.userId, dto);
    }
    async cancel(id, req, dto) {
        return this.workflowsService.cancel(id, req.user.organizationId, req.user.userId, dto);
    }
    async rollback(id, req, dto) {
        return this.workflowsService.rollback(id, req.user.organizationId, req.user.userId, dto);
    }
    async remove(id, req) {
        return this.workflowsService.remove(id, req.user.organizationId, req.user.userId);
    }
};
exports.WorkflowsController = WorkflowsController;
__decorate([
    (0, common_1.Get)("templates"),
    (0, swagger_1.ApiOperation)({ summary: "List workflow templates in the registry" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of workflow templates" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Query)("caseType")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "listTemplates", null);
__decorate([
    (0, common_1.Post)("from-template"),
    (0, swagger_1.ApiOperation)({ summary: "Create workflow from a template ID" }),
    (0, permissions_decorator_1.RequirePermissions)("workflows:write"),
    (0, audited_decorator_1.Audited)({ action: "workflow.create_from_template", resource: "workflow", captureNewValue: true }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Workflow created from template", type: workflow_entity_1.WorkflowEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid template or input" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_workflow_from_template_dto_1.CreateWorkflowFromTemplateDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "createFromTemplate", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new workflow" }),
    (0, permissions_decorator_1.RequirePermissions)("workflows:write"),
    (0, audited_decorator_1.Audited)({ action: "workflow.create", resource: "workflow", captureNewValue: true }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Workflow created", type: workflow_entity_1.WorkflowEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_workflow_dto_1.CreateWorkflowDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List all workflows" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of workflows" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, workflow_query_dto_1.WorkflowQueryDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("exception-analytics"),
    (0, swagger_1.ApiOperation)({ summary: "Get workflow exception and retry analytics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Workflow exception analytics" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "getExceptionAnalytics", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get workflow by ID" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Workflow ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Workflow details", type: workflow_entity_1.WorkflowEntity }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Workflow not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(":id/advance"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Advance workflow to next step" }),
    (0, permissions_decorator_1.RequirePermissions)("workflows:update"),
    (0, audited_decorator_1.Audited)({
        action: "workflow.advance",
        resource: "workflow",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Workflow ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Workflow advanced", type: workflow_entity_1.WorkflowEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid action or workflow state" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Workflow not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, advance_workflow_dto_1.AdvanceWorkflowDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "advance", null);
__decorate([
    (0, common_1.Post)(":id/cancel"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Cancel a workflow" }),
    (0, permissions_decorator_1.RequirePermissions)("workflows:update"),
    (0, audited_decorator_1.Audited)({
        action: "workflow.cancel",
        resource: "workflow",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Workflow ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Workflow cancelled", type: workflow_entity_1.WorkflowEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Cannot cancel workflow" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Workflow not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, advance_workflow_dto_1.CancelWorkflowDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "cancel", null);
__decorate([
    (0, common_1.Post)(":id/rollback"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Rollback workflow to a previous step" }),
    (0, permissions_decorator_1.RequirePermissions)("workflows:update"),
    (0, audited_decorator_1.Audited)({
        action: "workflow.rollback",
        resource: "workflow",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Workflow ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Workflow rolled back", type: workflow_entity_1.WorkflowEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Cannot rollback workflow" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Workflow not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, advance_workflow_dto_1.RollbackWorkflowDto]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "rollback", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "Delete a workflow" }),
    (0, permissions_decorator_1.RequirePermissions)("workflows:delete"),
    (0, audited_decorator_1.Audited)({ action: "workflow.delete", resource: "workflow", capturePreviousValue: true }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Workflow ID" }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "Workflow deleted" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Workflow not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], WorkflowsController.prototype, "remove", null);
exports.WorkflowsController = WorkflowsController = __decorate([
    (0, swagger_1.ApiTags)("workflows"),
    (0, common_1.Controller)("workflows"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("workflows:read"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [workflows_service_1.WorkflowsService])
], WorkflowsController);
//# sourceMappingURL=workflows.controller.js.map