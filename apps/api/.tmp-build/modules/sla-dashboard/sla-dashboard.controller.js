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
exports.SLADashboardController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/jwt-auth.guard");
const permissions_guard_1 = require("@/modules/auth/guards/permissions.guard");
const permissions_decorator_1 = require("@/modules/auth/decorators/permissions.decorator");
const sla_dashboard_service_1 = require("./sla-dashboard.service");
const sla_targets_dto_1 = require("./dto/sla-targets.dto");
let SLADashboardController = class SLADashboardController {
    slaDashboardService;
    constructor(slaDashboardService) {
        this.slaDashboardService = slaDashboardService;
    }
    getMetrics(req, period) {
        return this.slaDashboardService.getSLAMetrics(req.user.organizationId, period || "7d");
    }
    getBreached(req) {
        return this.slaDashboardService.getBreachedSLAs(req.user.organizationId);
    }
    getAtRisk(req) {
        return this.slaDashboardService.getAtRiskSLAs(req.user.organizationId);
    }
    getTargets(req) {
        return this.slaDashboardService.getSLATargets(req.user.organizationId);
    }
    updateTargets(req, dto) {
        return this.slaDashboardService.updateSLATargets(req.user.organizationId, dto.targets);
    }
};
exports.SLADashboardController = SLADashboardController;
__decorate([
    (0, common_1.Get)("metrics"),
    (0, swagger_1.ApiOperation)({ summary: "Get SLA metrics and compliance data" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("period")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SLADashboardController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)("breached"),
    (0, swagger_1.ApiOperation)({ summary: "Get all breached SLAs" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SLADashboardController.prototype, "getBreached", null);
__decorate([
    (0, common_1.Get)("at-risk"),
    (0, swagger_1.ApiOperation)({ summary: "Get all at-risk SLAs" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SLADashboardController.prototype, "getAtRisk", null);
__decorate([
    (0, common_1.Get)("targets"),
    (0, swagger_1.ApiOperation)({ summary: "Get SLA target policies by priority" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SLADashboardController.prototype, "getTargets", null);
__decorate([
    (0, common_1.Put)("targets"),
    (0, permissions_decorator_1.RequirePermissions)("admin:all"),
    (0, swagger_1.ApiOperation)({ summary: "Update SLA target policies by priority" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, sla_targets_dto_1.UpdateSLATargetsDto]),
    __metadata("design:returntype", void 0)
], SLADashboardController.prototype, "updateTargets", null);
exports.SLADashboardController = SLADashboardController = __decorate([
    (0, swagger_1.ApiTags)("dashboard-sla"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("sla:read"),
    (0, common_1.Controller)("dashboard/sla"),
    __metadata("design:paramtypes", [sla_dashboard_service_1.SLADashboardService])
], SLADashboardController);
//# sourceMappingURL=sla-dashboard.controller.js.map