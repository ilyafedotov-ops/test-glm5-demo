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
exports.RolesController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
const roles_service_1 = require("./roles.service");
const role_dto_1 = require("./dto/role.dto");
let RolesController = class RolesController {
    rolesService;
    constructor(rolesService) {
        this.rolesService = rolesService;
    }
    async findAll() {
        return this.rolesService.findAll();
    }
    async getPermissions() {
        return this.rolesService.getPermissions();
    }
    async findOne(id) {
        return this.rolesService.findOne(id);
    }
    async create(dto) {
        return this.rolesService.create(dto);
    }
    async update(id, dto) {
        return this.rolesService.update(id, dto);
    }
    async remove(id) {
        return this.rolesService.remove(id);
    }
};
exports.RolesController = RolesController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get all roles" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of roles" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("permissions"),
    (0, swagger_1.ApiOperation)({ summary: "Get all available permissions" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of permissions" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "getPermissions", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get role by ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Role details" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Role not found" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a new role" }),
    (0, audited_decorator_1.Audited)({ action: "role.create", resource: "role", captureNewValue: true }),
    (0, swagger_1.ApiResponse)({ status: 201, description: "Role created" }),
    (0, swagger_1.ApiResponse)({ status: 400, description: "Invalid input" }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [role_dto_1.CreateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update role" }),
    (0, audited_decorator_1.Audited)({
        action: "role.update",
        resource: "role",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Role updated" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Role not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, role_dto_1.UpdateRoleDto]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Delete role" }),
    (0, audited_decorator_1.Audited)({ action: "role.delete", resource: "role", capturePreviousValue: true }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Role deleted" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Role not found" }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], RolesController.prototype, "remove", null);
exports.RolesController = RolesController = __decorate([
    (0, swagger_1.ApiTags)("roles"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("admin:all"),
    (0, common_1.Controller)("roles"),
    __metadata("design:paramtypes", [roles_service_1.RolesService])
], RolesController);
//# sourceMappingURL=roles.controller.js.map