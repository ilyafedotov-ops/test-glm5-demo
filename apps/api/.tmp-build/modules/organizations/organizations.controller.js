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
exports.OrganizationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
const organizations_service_1 = require("./organizations.service");
const organization_dto_1 = require("./dto/organization.dto");
let OrganizationsController = class OrganizationsController {
    orgsService;
    constructor(orgsService) {
        this.orgsService = orgsService;
    }
    async getCurrentOrganization(req) {
        return this.orgsService.findOne(req.user.organizationId);
    }
    async updateCurrentOrganization(req, dto) {
        return this.orgsService.update(req.user.organizationId, dto);
    }
    async getOrganizationStats(req) {
        return this.orgsService.getStats(req.user.organizationId);
    }
};
exports.OrganizationsController = OrganizationsController;
__decorate([
    (0, common_1.Get)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Get current user's organization" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Organization details" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Organization not found" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "getCurrentOrganization", null);
__decorate([
    (0, common_1.Patch)("me"),
    (0, swagger_1.ApiOperation)({ summary: "Update current organization" }),
    (0, audited_decorator_1.Audited)({
        action: "organization.update",
        resource: "organization",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Organization updated" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, organization_dto_1.UpdateOrganizationDto]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "updateCurrentOrganization", null);
__decorate([
    (0, common_1.Get)("me/stats"),
    (0, swagger_1.ApiOperation)({ summary: "Get organization statistics" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Organization stats" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrganizationsController.prototype, "getOrganizationStats", null);
exports.OrganizationsController = OrganizationsController = __decorate([
    (0, swagger_1.ApiTags)("organizations"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("admin:all"),
    (0, common_1.Controller)("organizations"),
    __metadata("design:paramtypes", [organizations_service_1.OrganizationsService])
], OrganizationsController);
//# sourceMappingURL=organizations.controller.js.map