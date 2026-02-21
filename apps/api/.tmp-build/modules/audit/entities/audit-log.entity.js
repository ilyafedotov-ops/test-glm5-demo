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
exports.AuditLogDetail = exports.AuditLogDiff = exports.AuditLogListResponse = exports.AuditLogEntity = void 0;
const swagger_1 = require("@nestjs/swagger");
const system_links_1 = require("@/common/system-links/system-links");
class AuditLogEntity {
    id;
    actorId;
    actorType;
    actorName;
    action;
    resource;
    resourceId;
    previousValue;
    newValue;
    metadata;
    ipAddress;
    userAgent;
    correlationId;
    organizationId;
    createdAt;
    systemRecordId;
    traceContext;
    relatedRecords;
}
exports.AuditLogEntity = AuditLogEntity;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Audit log ID" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Actor (user) ID" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "actorId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Actor type (user, system, api)" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "actorType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Actor name" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "actorName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Action performed" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Resource type" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "resource", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Resource ID" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "resourceId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Previous value (before change)" }),
    __metadata("design:type", Object)
], AuditLogEntity.prototype, "previousValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "New value (after change)" }),
    __metadata("design:type", Object)
], AuditLogEntity.prototype, "newValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Additional metadata" }),
    __metadata("design:type", Object)
], AuditLogEntity.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "IP address" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "ipAddress", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "User agent" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "userAgent", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Correlation ID for request tracing" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "correlationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Organization ID" }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Timestamp" }),
    __metadata("design:type", Date)
], AuditLogEntity.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Globally unique system record identifier (<entityType>:<entityId>)",
        example: "audit_log:6f6f92ac-8f72-4042-a84a-f2aa79f4ebfb",
    }),
    __metadata("design:type", String)
], AuditLogEntity.prototype, "systemRecordId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: system_links_1.TraceContext,
        description: "Trace fields used to correlate records across workflows, tasks, compliance, and audit logs",
    }),
    __metadata("design:type", system_links_1.TraceContext)
], AuditLogEntity.prototype, "traceContext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [system_links_1.RelatedRecord],
        description: "Cross-domain records related to this audit event",
    }),
    __metadata("design:type", Array)
], AuditLogEntity.prototype, "relatedRecords", void 0);
class AuditLogListResponse {
    data;
    pagination;
}
exports.AuditLogListResponse = AuditLogListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AuditLogEntity] }),
    __metadata("design:type", Array)
], AuditLogListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], AuditLogListResponse.prototype, "pagination", void 0);
class AuditLogDiff {
    field;
    oldValue;
    newValue;
    changeType;
}
exports.AuditLogDiff = AuditLogDiff;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Field path" }),
    __metadata("design:type", String)
], AuditLogDiff.prototype, "field", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Old value" }),
    __metadata("design:type", Object)
], AuditLogDiff.prototype, "oldValue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "New value" }),
    __metadata("design:type", Object)
], AuditLogDiff.prototype, "newValue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Type of change (added, removed, modified)" }),
    __metadata("design:type", String)
], AuditLogDiff.prototype, "changeType", void 0);
class AuditLogDetail extends AuditLogEntity {
    diffs;
}
exports.AuditLogDetail = AuditLogDetail;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [AuditLogDiff], description: "Field-level changes" }),
    __metadata("design:type", Array)
], AuditLogDetail.prototype, "diffs", void 0);
//# sourceMappingURL=audit-log.entity.js.map