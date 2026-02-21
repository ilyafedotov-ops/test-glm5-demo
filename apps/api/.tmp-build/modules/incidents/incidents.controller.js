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
exports.IncidentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const incidents_service_1 = require("./incidents.service");
const create_incident_dto_1 = require("./dto/create-incident.dto");
const update_incident_dto_1 = require("./dto/update-incident.dto");
const query_incidents_dto_1 = require("./dto/query-incidents.dto");
const transition_incident_dto_1 = require("./dto/transition-incident.dto");
const merge_incidents_dto_1 = require("./dto/merge-incidents.dto");
const export_service_1 = require("../export/export.service");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
let IncidentsController = class IncidentsController {
    incidentsService;
    exportService;
    constructor(incidentsService, exportService) {
        this.incidentsService = incidentsService;
        this.exportService = exportService;
    }
    async findAll(req, query) {
        return this.incidentsService.findAll(req.user.organizationId, query);
    }
    async create(req, dto) {
        return this.incidentsService.create(req.user.organizationId, req.user.userId, dto);
    }
    async getOptions(req) {
        return this.incidentsService.getOptions(req.user.organizationId);
    }
    async findOne(id, req) {
        return this.incidentsService.findOne(id, req.user.organizationId);
    }
    async findDuplicates(id, req, query) {
        return this.incidentsService.findPotentialDuplicates(req.user.organizationId, id, query.limit);
    }
    async update(id, req, dto) {
        return this.incidentsService.update(id, req.user.organizationId, dto);
    }
    async transition(id, req, dto) {
        return this.incidentsService.transitionStrict(id, req.user.organizationId, req.user.userId, dto);
    }
    async addComment(id, req, body) {
        return this.incidentsService.addComment(id, req.user.organizationId, req.user.userId, body.content, body.isInternal);
    }
    async mergeIncidents(req, dto) {
        return this.incidentsService.mergeIncidents(req.user.organizationId, req.user.userId, dto);
    }
    async exportCSV(req, query, res) {
        const { data } = await this.incidentsService.findAll(req.user.organizationId, { ...query, limit: 1000 });
        const fields = [
            "ticketNumber",
            "title",
            "status",
            "priority",
            "impact",
            "urgency",
            "channel",
            "createdAt",
            "resolvedAt",
            "assignee.firstName",
            "assignee.lastName",
        ];
        const csv = this.exportService.toCSV(data, fields);
        const filename = this.exportService.formatExportFilename("incidents");
        res.setHeader("Content-Type", "text/csv");
        res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
        res.send(csv);
    }
};
exports.IncidentsController = IncidentsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all incidents with filtering" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_incidents_dto_1.QueryIncidentsDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new incident" }),
    (0, permissions_decorator_1.RequirePermissions)("incidents:write"),
    (0, audited_decorator_1.Audited)({ action: "incident.create", resource: "incident", captureNewValue: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, create_incident_dto_1.CreateIncidentDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("options"),
    (0, swagger_1.ApiOperation)({ summary: "Get incident form options (categories, channels, transition codes)" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "getOptions", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get incident by ID" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(":id/duplicates"),
    (0, swagger_1.ApiOperation)({ summary: "Find potential duplicate incidents for a given incident" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, merge_incidents_dto_1.QueryIncidentDuplicatesDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "findDuplicates", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update incident" }),
    (0, permissions_decorator_1.RequirePermissions)("incidents:update"),
    (0, audited_decorator_1.Audited)({
        action: "incident.update",
        resource: "incident",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, update_incident_dto_1.UpdateIncidentDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/transition"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Strict ITIL incident transition with gate checks" }),
    (0, permissions_decorator_1.RequirePermissions)("incidents:update"),
    (0, audited_decorator_1.Audited)({
        action: "incident.transition",
        resource: "incident",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, transition_incident_dto_1.TransitionIncidentDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "transition", null);
__decorate([
    (0, common_1.Post)(":id/comments"),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    (0, swagger_1.ApiOperation)({ summary: "Add comment to incident" }),
    (0, permissions_decorator_1.RequirePermissions)("incidents:update"),
    (0, audited_decorator_1.Audited)({ action: "incident.comment", resource: "incident", captureNewValue: true }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "addComment", null);
__decorate([
    (0, common_1.Post)("merge"),
    (0, swagger_1.ApiOperation)({ summary: "Merge duplicate incidents into a target incident" }),
    (0, permissions_decorator_1.RequirePermissions)("incidents:update"),
    (0, audited_decorator_1.Audited)({
        action: "incident.merge",
        resource: "incident",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, merge_incidents_dto_1.MergeIncidentsDto]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "mergeIncidents", null);
__decorate([
    (0, common_1.Get)("export/csv"),
    (0, swagger_1.ApiOperation)({ summary: "Export incidents to CSV" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, query_incidents_dto_1.QueryIncidentsDto, Object]),
    __metadata("design:returntype", Promise)
], IncidentsController.prototype, "exportCSV", null);
exports.IncidentsController = IncidentsController = __decorate([
    (0, swagger_1.ApiTags)("incidents"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("incidents:read"),
    (0, common_1.Controller)("incidents"),
    __metadata("design:paramtypes", [incidents_service_1.IncidentsService,
        export_service_1.ExportService])
], IncidentsController);
//# sourceMappingURL=incidents.controller.js.map