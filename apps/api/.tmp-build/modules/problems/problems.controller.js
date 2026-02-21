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
exports.ProblemsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/jwt-auth.guard");
const permissions_guard_1 = require("@/modules/auth/guards/permissions.guard");
const permissions_decorator_1 = require("@/modules/auth/decorators/permissions.decorator");
const audited_decorator_1 = require("@/modules/audit/decorators/audited.decorator");
const problems_service_1 = require("./problems.service");
const create_problem_dto_1 = require("./dto/create-problem.dto");
let ProblemsController = class ProblemsController {
    problemsService;
    constructor(problemsService) {
        this.problemsService = problemsService;
    }
    create(req, dto) {
        return this.problemsService.create(req.user.organizationId, req.user.userId, dto);
    }
    getOptions(req) {
        return this.problemsService.getOptions(req.user.organizationId);
    }
    findAll(req, query) {
        return this.problemsService.findAll(req.user.organizationId, query);
    }
    findOne(req, id) {
        return this.problemsService.findOne(req.user.organizationId, id);
    }
    update(req, id, dto) {
        return this.problemsService.update(req.user.organizationId, id, req.user.userId, dto);
    }
    addTask(req, id, data) {
        return this.problemsService.addTask(req.user.organizationId, id, req.user.userId, data);
    }
    convertToKnownError(req, id, data) {
        return this.problemsService.convertToKnownError(req.user.organizationId, id, req.user.userId, data);
    }
};
exports.ProblemsController = ProblemsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new problem" }),
    (0, permissions_decorator_1.RequirePermissions)("problems:write"),
    (0, audited_decorator_1.Audited)({ action: "problem.create", resource: "problem", captureNewValue: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_problem_dto_1.CreateProblemDto]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("options"),
    (0, swagger_1.ApiOperation)({ summary: "Get problem form options (incidents, users, teams)" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "getOptions", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List all problems" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get problem details" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update problem" }),
    (0, permissions_decorator_1.RequirePermissions)("problems:update"),
    (0, audited_decorator_1.Audited)({
        action: "problem.update",
        resource: "problem",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, create_problem_dto_1.UpdateProblemDto]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/tasks"),
    (0, swagger_1.ApiOperation)({ summary: "Add task to problem" }),
    (0, permissions_decorator_1.RequirePermissions)("problems:update"),
    (0, audited_decorator_1.Audited)({ action: "problem.add_task", resource: "problem", captureNewValue: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "addTask", null);
__decorate([
    (0, common_1.Post)(":id/convert-to-known-error"),
    (0, swagger_1.ApiOperation)({ summary: "Convert problem to known error" }),
    (0, permissions_decorator_1.RequirePermissions)("problems:update"),
    (0, audited_decorator_1.Audited)({
        action: "problem.convert_to_known_error",
        resource: "problem",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ProblemsController.prototype, "convertToKnownError", null);
exports.ProblemsController = ProblemsController = __decorate([
    (0, swagger_1.ApiTags)("problems"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("problems:read"),
    (0, common_1.Controller)("problems"),
    __metadata("design:paramtypes", [problems_service_1.ProblemsService])
], ProblemsController);
//# sourceMappingURL=problems.controller.js.map