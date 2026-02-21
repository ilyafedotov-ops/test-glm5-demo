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
exports.AdminGovernanceController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/jwt-auth.guard");
const permissions_guard_1 = require("@/modules/auth/guards/permissions.guard");
const permissions_decorator_1 = require("@/modules/auth/decorators/permissions.decorator");
const admin_governance_service_1 = require("./admin-governance.service");
const admin_governance_dto_1 = require("./dto/admin-governance.dto");
let AdminGovernanceController = class AdminGovernanceController {
    adminGovernanceService;
    constructor(adminGovernanceService) {
        this.adminGovernanceService = adminGovernanceService;
    }
    listPrivilegedAccessRequests(req, status) {
        return this.adminGovernanceService.listPrivilegedAccessRequests(req.user.organizationId, status);
    }
    createPrivilegedAccessRequest(req, dto) {
        return this.adminGovernanceService.createPrivilegedAccessRequest(req.user.organizationId, req.user.userId, dto);
    }
    reviewPrivilegedAccessRequest(req, requestId, dto) {
        return this.adminGovernanceService.reviewPrivilegedAccessRequest(req.user.organizationId, req.user.userId, requestId, dto);
    }
    getCabConfiguration(req) {
        return this.adminGovernanceService.getCabConfiguration(req.user.organizationId);
    }
    updateCabPolicy(req, dto) {
        return this.adminGovernanceService.updateCabPolicy(req.user.organizationId, dto);
    }
    updateCabMembers(req, dto) {
        return this.adminGovernanceService.updateCabMembers(req.user.organizationId, dto);
    }
};
exports.AdminGovernanceController = AdminGovernanceController;
__decorate([
    (0, common_1.Get)("privileged-access-requests"),
    (0, swagger_1.ApiOperation)({ summary: "List privileged access approval requests" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("status")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AdminGovernanceController.prototype, "listPrivilegedAccessRequests", null);
__decorate([
    (0, common_1.Post)("privileged-access-requests"),
    (0, swagger_1.ApiOperation)({ summary: "Create a privileged access approval request" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_governance_dto_1.CreatePrivilegedAccessRequestDto]),
    __metadata("design:returntype", void 0)
], AdminGovernanceController.prototype, "createPrivilegedAccessRequest", null);
__decorate([
    (0, common_1.Post)("privileged-access-requests/:id/review"),
    (0, swagger_1.ApiOperation)({ summary: "Approve or reject a privileged access request" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, admin_governance_dto_1.ReviewPrivilegedAccessRequestDto]),
    __metadata("design:returntype", void 0)
], AdminGovernanceController.prototype, "reviewPrivilegedAccessRequest", null);
__decorate([
    (0, common_1.Get)("cab"),
    (0, swagger_1.ApiOperation)({ summary: "Get CAB governance policy and members" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AdminGovernanceController.prototype, "getCabConfiguration", null);
__decorate([
    (0, common_1.Put)("cab/policy"),
    (0, swagger_1.ApiOperation)({ summary: "Update CAB governance policy" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_governance_dto_1.UpdateCabPolicyDto]),
    __metadata("design:returntype", void 0)
], AdminGovernanceController.prototype, "updateCabPolicy", null);
__decorate([
    (0, common_1.Put)("cab/members"),
    (0, swagger_1.ApiOperation)({ summary: "Replace CAB membership roster" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, admin_governance_dto_1.UpdateCabMembersDto]),
    __metadata("design:returntype", void 0)
], AdminGovernanceController.prototype, "updateCabMembers", null);
exports.AdminGovernanceController = AdminGovernanceController = __decorate([
    (0, swagger_1.ApiTags)("admin-governance"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("admin:all"),
    (0, common_1.Controller)("admin-governance"),
    __metadata("design:paramtypes", [admin_governance_service_1.AdminGovernanceService])
], AdminGovernanceController);
//# sourceMappingURL=admin-governance.controller.js.map