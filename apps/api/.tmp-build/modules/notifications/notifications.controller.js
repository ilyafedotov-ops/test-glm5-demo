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
exports.NotificationsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const notifications_service_1 = require("./notifications.service");
const jwt_auth_guard_1 = require("../auth/jwt-auth.guard");
const permissions_guard_1 = require("../auth/guards/permissions.guard");
const permissions_decorator_1 = require("../auth/decorators/permissions.decorator");
const notification_dto_1 = require("./dto/notification.dto");
const notification_entity_1 = require("./entities/notification.entity");
const audited_decorator_1 = require("../audit/decorators/audited.decorator");
let NotificationsController = class NotificationsController {
    notificationsService;
    constructor(notificationsService) {
        this.notificationsService = notificationsService;
    }
    async findAll(req, query) {
        return this.notificationsService.findAll(req.user.userId, query);
    }
    async markAsRead(id, req) {
        return this.notificationsService.markAsRead(id, req.user.userId);
    }
    async markAllAsRead(req) {
        return this.notificationsService.markAllAsRead(req.user.userId);
    }
    async remove(id, req) {
        return this.notificationsService.remove(id, req.user.userId);
    }
    async getPreferences(req) {
        return this.notificationsService.getPreferences(req.user.userId);
    }
    async updatePreferences(req, dto) {
        return this.notificationsService.updatePreferences(req.user.userId, dto);
    }
};
exports.NotificationsController = NotificationsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get user notifications" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "List of notifications" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_dto_1.NotificationQueryDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Patch)(":id/read"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Mark notification as read" }),
    (0, permissions_decorator_1.RequirePermissions)("notifications:update"),
    (0, audited_decorator_1.Audited)({
        action: "notification.mark_read",
        resource: "notification",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Notification ID" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Notification marked as read", type: notification_entity_1.NotificationEntity }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    (0, swagger_1.ApiResponse)({ status: 404, description: "Notification not found" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAsRead", null);
__decorate([
    (0, common_1.Patch)("read-all"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "Mark all notifications as read" }),
    (0, permissions_decorator_1.RequirePermissions)("notifications:update"),
    (0, audited_decorator_1.Audited)({ action: "notification.mark_all_read", resource: "notification" }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "All notifications marked as read" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "markAllAsRead", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    (0, swagger_1.ApiOperation)({ summary: "Delete a notification" }),
    (0, permissions_decorator_1.RequirePermissions)("notifications:delete"),
    (0, audited_decorator_1.Audited)({ action: "notification.delete", resource: "notification", capturePreviousValue: true }),
    (0, swagger_1.ApiParam)({ name: "id", description: "Notification ID" }),
    (0, swagger_1.ApiResponse)({ status: 204, description: "Notification deleted" }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)("preferences"),
    (0, swagger_1.ApiOperation)({ summary: "Get notification preferences" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Notification preferences", type: notification_entity_1.NotificationPreferences }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "getPreferences", null);
__decorate([
    (0, common_1.Patch)("preferences"),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: "Update notification preferences" }),
    (0, permissions_decorator_1.RequirePermissions)("notifications:update"),
    (0, audited_decorator_1.Audited)({
        action: "notification_preferences.update",
        resource: "notificationPreference",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Preferences updated", type: notification_entity_1.NotificationPreferences }),
    (0, swagger_1.ApiResponse)({ status: 401, description: "Unauthorized" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, notification_dto_1.UpdateNotificationPreferencesDto]),
    __metadata("design:returntype", Promise)
], NotificationsController.prototype, "updatePreferences", null);
exports.NotificationsController = NotificationsController = __decorate([
    (0, swagger_1.ApiTags)("notifications"),
    (0, common_1.Controller)("notifications"),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("notifications:read"),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [notifications_service_1.NotificationsService])
], NotificationsController);
//# sourceMappingURL=notifications.controller.js.map