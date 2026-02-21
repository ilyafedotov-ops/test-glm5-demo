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
exports.ChangesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/jwt-auth.guard");
const permissions_guard_1 = require("@/modules/auth/guards/permissions.guard");
const permissions_decorator_1 = require("@/modules/auth/decorators/permissions.decorator");
const changes_service_1 = require("./changes.service");
const create_change_dto_1 = require("./dto/create-change.dto");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
let ChangesController = class ChangesController {
    changesService;
    constructor(changesService) {
        this.changesService = changesService;
    }
    create(req, dto) {
        return this.changesService.create(req.user.organizationId, req.user.userId, dto);
    }
    findAll(req, query) {
        return this.changesService.findAll(req.user.organizationId, query);
    }
    findOne(req, id) {
        return this.changesService.findOne(req.user.organizationId, id);
    }
    update(req, id, dto) {
        return this.changesService.update(req.user.organizationId, id, req.user.userId, dto);
    }
    submitForApproval(req, id) {
        return this.changesService.submitForApproval(req.user.organizationId, id, req.user.userId);
    }
    approve(req, id, body) {
        return this.changesService.approve(req.user.organizationId, id, req.user.userId, body.comments);
    }
    reject(req, id, body) {
        return this.changesService.reject(req.user.organizationId, id, req.user.userId, body.reason);
    }
    startImplementation(req, id) {
        return this.changesService.startImplementation(req.user.organizationId, id, req.user.userId);
    }
    complete(req, id, body) {
        return this.changesService.complete(req.user.organizationId, id, req.user.userId, body);
    }
    addTask(req, id, data) {
        return this.changesService.addTask(req.user.organizationId, id, req.user.userId, data);
    }
};
exports.ChangesController = ChangesController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new change request" }),
    (0, permissions_decorator_1.RequirePermissions)("changes:write"),
    (0, audited_decorator_1.Audited)({ action: "change.create", resource: "changeRequest", captureNewValue: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_change_dto_1.CreateChangeDto]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List all change requests" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get change request details" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update change request" }),
    (0, permissions_decorator_1.RequirePermissions)("changes:update"),
    (0, audited_decorator_1.Audited)({
        action: "change.update",
        resource: "changeRequest",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_change_dto_1.UpdateChangeDto]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/submit"),
    (0, swagger_1.ApiOperation)({ summary: "Submit change for approval" }),
    (0, permissions_decorator_1.RequirePermissions)("changes:update"),
    (0, audited_decorator_1.Audited)({
        action: "change.submit",
        resource: "changeRequest",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "submitForApproval", null);
__decorate([
    (0, common_1.Post)(":id/approve"),
    (0, swagger_1.ApiOperation)({ summary: "Approve change request" }),
    (0, permissions_decorator_1.RequirePermissions)("changes:update"),
    (0, audited_decorator_1.Audited)({
        action: "change.approve",
        resource: "changeRequest",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(":id/reject"),
    (0, swagger_1.ApiOperation)({ summary: "Reject change request" }),
    (0, permissions_decorator_1.RequirePermissions)("changes:update"),
    (0, audited_decorator_1.Audited)({
        action: "change.reject",
        resource: "changeRequest",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(":id/implement"),
    (0, swagger_1.ApiOperation)({ summary: "Start implementation" }),
    (0, permissions_decorator_1.RequirePermissions)("changes:update"),
    (0, audited_decorator_1.Audited)({
        action: "change.implement",
        resource: "changeRequest",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "startImplementation", null);
__decorate([
    (0, common_1.Post)(":id/complete"),
    (0, swagger_1.ApiOperation)({ summary: "Mark change as completed" }),
    (0, permissions_decorator_1.RequirePermissions)("changes:update"),
    (0, audited_decorator_1.Audited)({
        action: "change.complete",
        resource: "changeRequest",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_change_dto_1.CompleteChangeDto]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "complete", null);
__decorate([
    (0, common_1.Post)(":id/tasks"),
    (0, swagger_1.ApiOperation)({ summary: "Add task to change" }),
    (0, permissions_decorator_1.RequirePermissions)("changes:update"),
    (0, audited_decorator_1.Audited)({ action: "change.add_task", resource: "changeRequest", captureNewValue: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ChangesController.prototype, "addTask", null);
exports.ChangesController = ChangesController = __decorate([
    (0, swagger_1.ApiTags)("changes"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("changes:read"),
    (0, common_1.Controller)("changes"),
    __metadata("design:paramtypes", [changes_service_1.ChangesService])
], ChangesController);
//# sourceMappingURL=changes.controller.js.map