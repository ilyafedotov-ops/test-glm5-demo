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
exports.PoliciesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
const policies_service_1 = require("./policies.service");
const create_policy_dto_1 = require("./dto/create-policy.dto");
const policy_exception_dto_1 = require("./dto/policy-exception.dto");
let PoliciesController = class PoliciesController {
    policiesService;
    constructor(policiesService) {
        this.policiesService = policiesService;
    }
    async findAll(req, page, limit) {
        return this.policiesService.findAll(req.user.organizationId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20);
    }
    async create(req, dto) {
        return this.policiesService.create(req.user.organizationId, dto);
    }
    async findOne(id, req) {
        return this.policiesService.findOne(id, req.user.organizationId);
    }
    async update(id, req, dto) {
        return this.policiesService.update(id, req.user.organizationId, dto);
    }
    async findExceptions(id, req) {
        return this.policiesService.listExceptions(id, req.user.organizationId);
    }
    async createException(id, req, dto) {
        return this.policiesService.createException(id, req.user.organizationId, req.user.userId, dto);
    }
    async approveException(id, exceptionId, req, dto) {
        return this.policiesService.approveException(id, exceptionId, req.user.organizationId, req.user.userId, dto.note);
    }
    async rejectException(id, exceptionId, req, dto) {
        return this.policiesService.rejectException(id, exceptionId, req.user.organizationId, req.user.userId, dto.note);
    }
};
exports.PoliciesController = PoliciesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all policies" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new policy" }),
    (0, permissions_decorator_1.RequirePermissions)("policies:write"),
    (0, audited_decorator_1.Audited)({ action: "policy.create", resource: "policy", captureNewValue: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_policy_dto_1.CreatePolicyDto]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get policy by ID" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update policy" }),
    (0, permissions_decorator_1.RequirePermissions)("policies:write"),
    (0, audited_decorator_1.Audited)({
        action: "policy.update",
        resource: "policy",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(":id/exceptions"),
    (0, swagger_1.ApiOperation)({ summary: "List policy exceptions" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "findExceptions", null);
__decorate([
    (0, common_1.Post)(":id/exceptions"),
    (0, swagger_1.ApiOperation)({ summary: "Create policy exception request" }),
    (0, permissions_decorator_1.RequirePermissions)("policies:write"),
    (0, audited_decorator_1.Audited)({
        action: "policy.exception.create",
        resource: "policy",
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, policy_exception_dto_1.CreatePolicyExceptionDto]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "createException", null);
__decorate([
    (0, common_1.Post)(":id/exceptions/:exceptionId/approve"),
    (0, swagger_1.ApiOperation)({ summary: "Approve policy exception" }),
    (0, permissions_decorator_1.RequirePermissions)("policies:write"),
    (0, audited_decorator_1.Audited)({
        action: "policy.exception.approve",
        resource: "policy",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("exceptionId")),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, policy_exception_dto_1.ReviewPolicyExceptionDto]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "approveException", null);
__decorate([
    (0, common_1.Post)(":id/exceptions/:exceptionId/reject"),
    (0, swagger_1.ApiOperation)({ summary: "Reject policy exception" }),
    (0, permissions_decorator_1.RequirePermissions)("policies:write"),
    (0, audited_decorator_1.Audited)({
        action: "policy.exception.reject",
        resource: "policy",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("exceptionId")),
    __param(2, (0, common_1.Request)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, policy_exception_dto_1.ReviewPolicyExceptionDto]),
    __metadata("design:returntype", Promise)
], PoliciesController.prototype, "rejectException", null);
exports.PoliciesController = PoliciesController = __decorate([
    (0, swagger_1.ApiTags)("policies"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("policies:read"),
    (0, common_1.Controller)("policies"),
    __metadata("design:paramtypes", [policies_service_1.PoliciesService])
], PoliciesController);
//# sourceMappingURL=policies.controller.js.map