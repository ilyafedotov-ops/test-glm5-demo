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
exports.TeamsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
const teams_service_1 = require("./teams.service");
const team_dto_1 = require("./dto/team.dto");
let TeamsController = class TeamsController {
    teamsService;
    constructor(teamsService) {
        this.teamsService = teamsService;
    }
    async findAll(req) {
        return this.teamsService.findAll(req.user.organizationId);
    }
    async findOne(id, req) {
        return this.teamsService.findOne(id, req.user.organizationId);
    }
    async create(req, dto) {
        return this.teamsService.create(req.user.organizationId, req.user.userId, dto);
    }
    async update(id, req, dto) {
        return this.teamsService.update(id, req.user.organizationId, dto);
    }
    async remove(id, req) {
        return this.teamsService.remove(id, req.user.organizationId);
    }
    async getMembers(id, req) {
        return this.teamsService.getMembers(id, req.user.organizationId);
    }
    async addMember(id, req, dto) {
        return this.teamsService.addMember(id, req.user.organizationId, dto);
    }
    async removeMember(id, userId, req) {
        return this.teamsService.removeMember(id, userId, req.user.organizationId);
    }
};
exports.TeamsController = TeamsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all teams in organization" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of teams" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get team by ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Team details" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Team not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new team" }),
    (0, audited_decorator_1.Audited)({ action: "team.create", resource: "team", captureNewValue: true }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Team created" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, team_dto_1.CreateTeamDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update team" }),
    (0, audited_decorator_1.Audited)({
        action: "team.update",
        resource: "team",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Team updated" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, team_dto_1.UpdateTeamDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Delete team" }),
    (0, audited_decorator_1.Audited)({ action: "team.delete", resource: "team", capturePreviousValue: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Team deleted" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)(":id/members"),
    (0, swagger_1.ApiOperation)({ summary: "Get team members" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of team members" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "getMembers", null);
__decorate([
    (0, common_1.Post)(":id/members"),
    (0, swagger_1.ApiOperation)({ summary: "Add member to team" }),
    (0, audited_decorator_1.Audited)({
        action: "team.add_member",
        resource: "team",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Member added" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, team_dto_1.AddMemberDto]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)(":id/members/:userId"),
    (0, swagger_1.ApiOperation)({ summary: "Remove member from team" }),
    (0, audited_decorator_1.Audited)({
        action: "team.remove_member",
        resource: "team",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Member removed" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Param)("userId")),
    __param(2, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TeamsController.prototype, "removeMember", null);
exports.TeamsController = TeamsController = __decorate([
    (0, swagger_1.ApiTags)("teams"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("admin:all"),
    (0, common_1.Controller)("teams"),
    __metadata("design:paramtypes", [teams_service_1.TeamsService])
], TeamsController);
//# sourceMappingURL=teams.controller.js.map