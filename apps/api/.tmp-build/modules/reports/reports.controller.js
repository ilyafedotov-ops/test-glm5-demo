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
exports.ReportsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
const reports_service_1 = require("./reports.service");
const run_report_dto_1 = require("./dto/run-report.dto");
let ReportsController = class ReportsController {
    reportsService;
    constructor(reportsService) {
        this.reportsService = reportsService;
    }
    async getAvailableReports() {
        return this.reportsService.getAvailableReports();
    }
    async getReportJobs(req, page, limit, status, type, format) {
        return this.reportsService.getReportJobs(req.user.organizationId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, { status, type, format });
    }
    async runReport(req, dto) {
        return this.reportsService.runReport(req.user.organizationId, req.user.userId, dto);
    }
    async getReportJob(id, req) {
        return this.reportsService.getReportJob(id, req.user.organizationId);
    }
};
exports.ReportsController = ReportsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get available report types" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getAvailableReports", null);
__decorate([
    (0, common_1.Get)("jobs"),
    (0, swagger_1.ApiOperation)({ summary: "Get report job history" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("page")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Query)("status")),
    __param(4, (0, common_1.Query)("type")),
    __param(5, (0, common_1.Query)("format")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getReportJobs", null);
__decorate([
    (0, common_1.Post)("run"),
    (0, swagger_1.ApiOperation)({ summary: "Run a report" }),
    (0, permissions_decorator_1.RequirePermissions)("reports:write"),
    (0, audited_decorator_1.Audited)({ action: "report.run", resource: "reportJob", captureNewValue: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, run_report_dto_1.RunReportDto]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "runReport", null);
__decorate([
    (0, common_1.Get)("jobs/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get report job status" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ReportsController.prototype, "getReportJob", null);
exports.ReportsController = ReportsController = __decorate([
    (0, swagger_1.ApiTags)("reports"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("reports:read"),
    (0, common_1.Controller)("reports"),
    __metadata("design:paramtypes", [reports_service_1.ReportsService])
], ReportsController);
//# sourceMappingURL=reports.controller.js.map