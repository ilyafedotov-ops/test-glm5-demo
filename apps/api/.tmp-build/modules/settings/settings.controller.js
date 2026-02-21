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
exports.SettingsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/jwt-auth.guard");
const permissions_guard_1 = require("@/modules/auth/guards/permissions.guard");
const permissions_decorator_1 = require("@/modules/auth/decorators/permissions.decorator");
const audited_decorator_1 = require("@/modules/audit/decorators/audited.decorator");
const settings_service_1 = require("./settings.service");
let SettingsController = class SettingsController {
    settingsService;
    constructor(settingsService) {
        this.settingsService = settingsService;
    }
    createWebhook(req, data) {
        return this.settingsService.createWebhook(req.user.organizationId, req.user.userId, data);
    }
    findAllWebhooks(req) {
        return this.settingsService.findAllWebhooks(req.user.organizationId);
    }
    updateWebhook(req, id, data) {
        return this.settingsService.updateWebhook(req.user.organizationId, id, data);
    }
    deleteWebhook(req, id) {
        return this.settingsService.deleteWebhook(req.user.organizationId, id);
    }
    async testWebhook(req, id) {
        return this.settingsService.testWebhook(req.user.organizationId, id);
    }
};
exports.SettingsController = SettingsController;
__decorate([
    (0, common_1.Post)("webhooks"),
    (0, swagger_1.ApiOperation)({ summary: "Create a webhook" }),
    (0, audited_decorator_1.Audited)({ action: "webhook.create", resource: "webhook", captureNewValue: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "createWebhook", null);
__decorate([
    (0, common_1.Get)("webhooks"),
    (0, swagger_1.ApiOperation)({ summary: "List all webhooks" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "findAllWebhooks", null);
__decorate([
    (0, common_1.Put)("webhooks/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Update a webhook" }),
    (0, audited_decorator_1.Audited)({
        action: "webhook.update",
        resource: "webhook",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "updateWebhook", null);
__decorate([
    (0, common_1.Delete)("webhooks/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Delete a webhook" }),
    (0, audited_decorator_1.Audited)({ action: "webhook.delete", resource: "webhook", capturePreviousValue: true }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SettingsController.prototype, "deleteWebhook", null);
__decorate([
    (0, common_1.Post)("webhooks/:id/test"),
    (0, swagger_1.ApiOperation)({ summary: "Send a test payload to the webhook" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], SettingsController.prototype, "testWebhook", null);
exports.SettingsController = SettingsController = __decorate([
    (0, swagger_1.ApiTags)("settings"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("admin:all"),
    (0, common_1.Controller)("settings"),
    __metadata("design:paramtypes", [settings_service_1.SettingsService])
], SettingsController);
//# sourceMappingURL=settings.controller.js.map