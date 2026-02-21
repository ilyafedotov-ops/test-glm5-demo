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
exports.ConfigurationItemsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/jwt-auth.guard");
const permissions_guard_1 = require("@/modules/auth/guards/permissions.guard");
const permissions_decorator_1 = require("@/modules/auth/decorators/permissions.decorator");
const audited_decorator_1 = require("@/modules/audit/decorators/audited.decorator");
const configuration_items_service_1 = require("./configuration-items.service");
const configuration_item_dto_1 = require("./dto/configuration-item.dto");
let ConfigurationItemsController = class ConfigurationItemsController {
    configurationItemsService;
    constructor(configurationItemsService) {
        this.configurationItemsService = configurationItemsService;
    }
    findAll(req, query) {
        return this.configurationItemsService.findAll(req.user.organizationId, query);
    }
    findOne(req, id) {
        return this.configurationItemsService.findOne(req.user.organizationId, id);
    }
    create(req, dto) {
        return this.configurationItemsService.create(req.user.organizationId, dto);
    }
    update(req, id, dto) {
        return this.configurationItemsService.update(req.user.organizationId, id, dto);
    }
    findRelationships(req, id) {
        return this.configurationItemsService.findRelationships(req.user.organizationId, id);
    }
    updateRelationships(req, id, dto) {
        return this.configurationItemsService.updateRelationships(req.user.organizationId, id, dto.relationships);
    }
    remove(req, id) {
        return this.configurationItemsService.remove(req.user.organizationId, id);
    }
};
exports.ConfigurationItemsController = ConfigurationItemsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List configuration items in organization" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, configuration_item_dto_1.QueryConfigurationItemsDto]),
    __metadata("design:returntype", void 0)
], ConfigurationItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get configuration item details" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ConfigurationItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create configuration item" }),
    (0, audited_decorator_1.Audited)({
        action: "configuration_item.create",
        resource: "configurationItem",
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, configuration_item_dto_1.CreateConfigurationItemDto]),
    __metadata("design:returntype", void 0)
], ConfigurationItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update configuration item" }),
    (0, audited_decorator_1.Audited)({
        action: "configuration_item.update",
        resource: "configurationItem",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, configuration_item_dto_1.UpdateConfigurationItemDto]),
    __metadata("design:returntype", void 0)
], ConfigurationItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Get)(":id/relationships"),
    (0, swagger_1.ApiOperation)({ summary: "Get configuration item relationships" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ConfigurationItemsController.prototype, "findRelationships", null);
__decorate([
    (0, common_1.Put)(":id/relationships"),
    (0, swagger_1.ApiOperation)({ summary: "Replace configuration item relationships" }),
    (0, audited_decorator_1.Audited)({
        action: "configuration_item.relationships.update",
        resource: "configurationItem",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, configuration_item_dto_1.UpdateConfigurationItemRelationshipsDto]),
    __metadata("design:returntype", void 0)
], ConfigurationItemsController.prototype, "updateRelationships", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Delete configuration item" }),
    (0, audited_decorator_1.Audited)({
        action: "configuration_item.delete",
        resource: "configurationItem",
        capturePreviousValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ConfigurationItemsController.prototype, "remove", null);
exports.ConfigurationItemsController = ConfigurationItemsController = __decorate([
    (0, swagger_1.ApiTags)("configuration-items"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("admin:all"),
    (0, common_1.Controller)("configuration-items"),
    __metadata("design:paramtypes", [configuration_items_service_1.ConfigurationItemsService])
], ConfigurationItemsController);
//# sourceMappingURL=configuration-items.controller.js.map