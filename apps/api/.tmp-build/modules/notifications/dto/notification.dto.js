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
exports.NotificationQueryDto = exports.UpdateNotificationPreferencesDto = exports.CreateNotificationDto = exports.NotificationChannel = exports.NotificationType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var NotificationType;
(function (NotificationType) {
    NotificationType["INCIDENT_CREATED"] = "incident_created";
    NotificationType["INCIDENT_ASSIGNED"] = "incident_assigned";
    NotificationType["INCIDENT_UPDATED"] = "incident_updated";
    NotificationType["INCIDENT_RESOLVED"] = "incident_resolved";
    NotificationType["SLA_BREACH_WARNING"] = "sla_breach_warning";
    NotificationType["SLA_BREACHED"] = "sla_breached";
    NotificationType["POLICY_VIOLATION"] = "policy_violation";
    NotificationType["VIOLATION_ASSIGNED"] = "violation_assigned";
    NotificationType["WORKFLOW_ASSIGNED"] = "workflow_assigned";
    NotificationType["WORKFLOW_COMPLETED"] = "workflow_completed";
    NotificationType["REPORT_READY"] = "report_ready";
    NotificationType["SYSTEM_ALERT"] = "system_alert";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationChannel;
(function (NotificationChannel) {
    NotificationChannel["IN_APP"] = "in_app";
    NotificationChannel["EMAIL"] = "email";
    NotificationChannel["PUSH"] = "push";
    NotificationChannel["SLACK"] = "slack";
})(NotificationChannel || (exports.NotificationChannel = NotificationChannel = {}));
class CreateNotificationDto {
    userId;
    type;
    title;
    message;
    actionUrl;
    metadata;
    channels;
}
exports.CreateNotificationDto = CreateNotificationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "User ID to notify" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Notification type", enum: NotificationType }),
    (0, class_validator_1.IsEnum)(NotificationType),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Notification title" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Notification message" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "URL to navigate when clicked" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateNotificationDto.prototype, "actionUrl", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Additional metadata" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateNotificationDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Channels to send to", enum: NotificationChannel, isArray: true }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Array)
], CreateNotificationDto.prototype, "channels", void 0);
class UpdateNotificationPreferencesDto {
    emailIncidentAssigned;
    emailIncidentResolved;
    emailSlaBreached;
    emailChangeApproved;
    emailDailyDigest;
    inAppAll;
}
exports.UpdateNotificationPreferencesDto = UpdateNotificationPreferencesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Email on incident assignment" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "emailIncidentAssigned", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Email on incident resolution" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "emailIncidentResolved", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Email when SLA is breached" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "emailSlaBreached", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Email when change is approved" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "emailChangeApproved", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Daily digest email preference" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "emailDailyDigest", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Enable all in-app notifications" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateNotificationPreferencesDto.prototype, "inAppAll", void 0);
class NotificationQueryDto {
    unread;
    type;
}
exports.NotificationQueryDto = NotificationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by read status" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], NotificationQueryDto.prototype, "unread", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by type" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(NotificationType),
    __metadata("design:type", String)
], NotificationQueryDto.prototype, "type", void 0);
//# sourceMappingURL=notification.dto.js.map