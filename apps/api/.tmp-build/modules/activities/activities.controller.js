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
exports.ActivitiesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const activities_service_1 = require("./activities.service");
let ActivitiesController = class ActivitiesController {
    activitiesService;
    constructor(activitiesService) {
        this.activitiesService = activitiesService;
    }
    async findAll(req, entityType, entityId, actorId, action, search, from, to, limit, offset) {
        return this.activitiesService.findAll(req.user.organizationId, {
            entityType,
            entityId,
            actorId,
            action,
            search,
            from,
            to,
            limit: limit ? parseInt(limit) : 50,
            offset: offset ? parseInt(offset) : 0,
        });
    }
    async getRecent(req, limit) {
        return this.activitiesService.getRecentActivity(req.user.organizationId, limit ? parseInt(limit) : 20);
    }
    async getTimeline(req, entityType, entityId) {
        return this.activitiesService.getEntityTimeline(req.user.organizationId, entityType, entityId);
    }
};
exports.ActivitiesController = ActivitiesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all activities for organization" }),
    (0, swagger_1.ApiQuery)({ name: "entityType", required: false }),
    (0, swagger_1.ApiQuery)({ name: "entityId", required: false }),
    (0, swagger_1.ApiQuery)({ name: "actorId", required: false }),
    (0, swagger_1.ApiQuery)({ name: "action", required: false }),
    (0, swagger_1.ApiQuery)({ name: "search", required: false }),
    (0, swagger_1.ApiQuery)({ name: "from", required: false }),
    (0, swagger_1.ApiQuery)({ name: "to", required: false }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: "offset", required: false, type: Number }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("entityType")),
    __param(2, (0, common_1.Query)("entityId")),
    __param(3, (0, common_1.Query)("actorId")),
    __param(4, (0, common_1.Query)("action")),
    __param(5, (0, common_1.Query)("search")),
    __param(6, (0, common_1.Query)("from")),
    __param(7, (0, common_1.Query)("to")),
    __param(8, (0, common_1.Query)("limit")),
    __param(9, (0, common_1.Query)("offset")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("recent"),
    (0, swagger_1.ApiOperation)({ summary: "Get recent activity feed" }),
    (0, swagger_1.ApiQuery)({ name: "limit", required: false, type: Number }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "getRecent", null);
__decorate([
    (0, common_1.Get)("timeline/:entityType/:entityId"),
    (0, swagger_1.ApiOperation)({ summary: "Get activity timeline for an entity" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("entityType")),
    __param(2, (0, common_1.Param)("entityId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", Promise)
], ActivitiesController.prototype, "getTimeline", null);
exports.ActivitiesController = ActivitiesController = __decorate([
    (0, swagger_1.ApiTags)("activities"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("activities:read"),
    (0, common_1.Controller)("activities"),
    __metadata("design:paramtypes", [activities_service_1.ActivitiesService])
], ActivitiesController);
//# sourceMappingURL=activities.controller.js.map