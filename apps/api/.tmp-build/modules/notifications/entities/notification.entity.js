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
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPreferences = exports.NotificationListResponse = exports.NotificationEntity = void 0;
const swagger_1 = require("@nestjs/swagger");
class NotificationEntity {
    id;
    userId;
    type;
    title;
    message;
    isRead;
    actionUrl;
    metadata;
    createdAt;
}
exports.NotificationEntity = NotificationEntity;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Notification ID" }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "User ID" }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Notification type" }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Notification title" }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Notification message" }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Whether the notification has been read" }),
    __metadata("design:type", Boolean)
], NotificationEntity.prototype, "isRead", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Action URL" }),
    __metadata("design:type", String)
], NotificationEntity.prototype, "actionUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Additional metadata" }),
    __metadata("design:type", Object)
], NotificationEntity.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Created timestamp" }),
    __metadata("design:type", Date)
], NotificationEntity.prototype, "createdAt", void 0);
class NotificationListResponse {
    data;
    unreadCount;
}
exports.NotificationListResponse = NotificationListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [NotificationEntity] }),
    __metadata("design:type", Array)
], NotificationListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Number)
], NotificationListResponse.prototype, "unreadCount", void 0);
class NotificationPreferences {
    emailIncidentAssigned;
    emailIncidentResolved;
    emailSlaBreached;
    emailChangeApproved;
    emailDailyDigest;
    inAppAll;
}
exports.NotificationPreferences = NotificationPreferences;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Email on incident assignment" }),
    __metadata("design:type", Boolean)
], NotificationPreferences.prototype, "emailIncidentAssigned", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Email on incident resolution" }),
    __metadata("design:type", Boolean)
], NotificationPreferences.prototype, "emailIncidentResolved", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Email when SLA is breached" }),
    __metadata("design:type", Boolean)
], NotificationPreferences.prototype, "emailSlaBreached", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Email when change is approved" }),
    __metadata("design:type", Boolean)
], NotificationPreferences.prototype, "emailChangeApproved", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Daily digest email preference" }),
    __metadata("design:type", Boolean)
], NotificationPreferences.prototype, "emailDailyDigest", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Enable all in-app notifications" }),
    __metadata("design:type", Boolean)
], NotificationPreferences.prototype, "inAppAll", void 0);
//# sourceMappingURL=notification.entity.js.map