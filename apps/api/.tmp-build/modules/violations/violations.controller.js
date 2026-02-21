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
exports.ViolationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const violations_service_1 = require("./violations.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const create_violation_dto_1 = require("./dto/create-violation.dto");
const update_violation_dto_1 = require("./dto/update-violation.dto");
const violation_query_dto_1 = require("./dto/violation-query.dto");
const violation_entity_1 = require("./entities/violation.entity");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
let ViolationsController = class ViolationsController {
    violationsService;
    constructor(violationsService) {
        this.violationsService = violationsService;
    }
    async create(req, dto) {
        return this.violationsService.create(req.user.organizationId, req.user.userId, dto);
    }
    async findAll(req, query) {
        return this.violationsService.findAll(req.user.organizationId, query);
    }
    async getStats(req) {
        return this.violationsService.getStats(req.user.organizationId);
    }
    async findOne(id, req) {
        return this.violationsService.findOne(id, req.user.organizationId);
    }
    async update(id, req, dto) {
        return this.violationsService.update(id, req.user.organizationId, req.user.userId, dto);
    }
    async acknowledge(id, req, dto) {
        return this.violationsService.acknowledge(id, req.user.organizationId, req.user.userId, dto);
    }
    async remediate(id, req, dto) {
        return this.violationsService.remediate(id, req.user.organizationId, req.user.userId, dto);
    }
    async assign(id, req, dto) {
        return this.violationsService.assign(id, req.user.organizationId, req.user.userId, dto);
    }
    async remove(id, req) {
        return this.violationsService.remove(id, req.user.organizationId, req.user.userId);
    }
};
exports.ViolationsController = ViolationsController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new violation" }),
    (0, permissions_decorator_1.RequirePermissions)("violations:write"),
    (0, audited_decorator_1.Audited)({ action: "violation.create", resource: "violation", captureNewValue: true }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Violation created", type: violation_entity_1.ViolationEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Policy not found" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_violation_dto_1.CreateViolationDto]),
    __metadata("design:returntype", Promise)
], ViolationsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List all violations" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of violations" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, violation_query_dto_1.ViolationQueryDto]),
    __metadata("design:returntype", Promise)
], ViolationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("stats"),
    (0, swagger_1.ApiOperation)({ summary: "Get violation statistics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Violation statistics", type: violation_entity_1.ViolationStats }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ViolationsController.prototype, "getStats", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get violation by ID" }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Violation ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Violation details", type: violation_entity_1.ViolationEntity }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Violation not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ViolationsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update violation" }),
    (0, permissions_decorator_1.RequirePermissions)("violations:update"),
    (0, audited_decorator_1.Audited)({
        action: "violation.update",
        resource: "violation",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Violation ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Violation updated", type: violation_entity_1.ViolationEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Violation not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_violation_dto_1.UpdateViolationDto]),
    __metadata("design:returntype", Promise)
], ViolationsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/acknowledge"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Acknowledge a violation" }),
    (0, permissions_decorator_1.RequirePermissions)("violations:update"),
    (0, audited_decorator_1.Audited)({
        action: "violation.acknowledge",
        resource: "violation",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Violation ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Violation acknowledged", type: violation_entity_1.ViolationEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Cannot acknowledge" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Violation not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_violation_dto_1.AcknowledgeViolationDto]),
    __metadata("design:returntype", Promise)
], ViolationsController.prototype, "acknowledge", null);
__decorate([
    (0, common_1.Post)(":id/remediate"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Mark violation as remediated" }),
    (0, permissions_decorator_1.RequirePermissions)("violations:update"),
    (0, audited_decorator_1.Audited)({
        action: "violation.remediate",
        resource: "violation",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Violation ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Violation remediated", type: violation_entity_1.ViolationEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Cannot remediate" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Violation not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_violation_dto_1.RemediateViolationDto]),
    __metadata("design:returntype", Promise)
], ViolationsController.prototype, "remediate", null);
__decorate([
    (0, common_1.Post)(":id/assign"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Assign violation to a user" }),
    (0, permissions_decorator_1.RequirePermissions)("violations:update"),
    (0, audited_decorator_1.Audited)({
        action: "violation.assign",
        resource: "violation",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Violation ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Violation assigned", type: violation_entity_1.ViolationEntity }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid assignee" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Violation or user not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_violation_dto_1.AssignViolationDto]),
    __metadata("design:returntype", Promise)
], ViolationsController.prototype, "assign", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "Delete a violation" }),
    (0, permissions_decorator_1.RequirePermissions)("violations:delete"),
    (0, audited_decorator_1.Audited)({ action: "violation.delete", resource: "violation", capturePreviousValue: true }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Violation ID" }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "Violation deleted" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Violation not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ViolationsController.prototype, "remove", null);
exports.ViolationsController = ViolationsController = __decorate([
    (0, swagger_1.ApiTags)("violations"),
    (0, common_1.Controller)("violations"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("violations:read"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [violations_service_1.ViolationsService])
], ViolationsController);
//# sourceMappingURL=violations.controller.js.map