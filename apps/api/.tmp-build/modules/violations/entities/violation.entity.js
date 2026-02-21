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
exports.ViolationStats = exports.ViolationListResponse = exports.ViolationEntity = void 0;
const swagger_1 = require("@nestjs/swagger");
const system_links_1 = require("@/common/system-links/system-links");
class ViolationEntity {
    id;
    policyId;
    policyName;
    entityId;
    entityType;
    status;
    severity;
    title;
    description;
    remediation;
    assigneeId;
    assigneeName;
    organizationId;
    detectedAt;
    acknowledgedAt;
    remediatedAt;
    createdAt;
    updatedAt;
    systemRecordId;
    traceContext;
    relatedRecords;
}
exports.ViolationEntity = ViolationEntity;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Violation ID" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Policy ID" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "policyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Policy name" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "policyName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Entity ID" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Entity type" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Violation status" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Violation severity" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Violation title" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Detailed description" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Remediation steps" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "remediation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Assignee user ID" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Assignee name" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "assigneeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Organization ID" }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Detection timestamp" }),
    __metadata("design:type", Date)
], ViolationEntity.prototype, "detectedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Acknowledgment timestamp" }),
    __metadata("design:type", Date)
], ViolationEntity.prototype, "acknowledgedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Remediation timestamp" }),
    __metadata("design:type", Date)
], ViolationEntity.prototype, "remediatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Created timestamp" }),
    __metadata("design:type", Date)
], ViolationEntity.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Updated timestamp" }),
    __metadata("design:type", Date)
], ViolationEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Globally unique system record identifier (<entityType>:<entityId>)",
        example: "violation:5cbe2f8c-e10e-4dd2-b963-9d88f195db5a",
    }),
    __metadata("design:type", String)
], ViolationEntity.prototype, "systemRecordId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: system_links_1.TraceContext,
        description: "Trace fields used to correlate records across workflows, tasks, compliance, and audit logs",
    }),
    __metadata("design:type", system_links_1.TraceContext)
], ViolationEntity.prototype, "traceContext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [system_links_1.RelatedRecord],
        description: "Cross-domain records related to this violation",
    }),
    __metadata("design:type", Array)
], ViolationEntity.prototype, "relatedRecords", void 0);
class ViolationListResponse {
    data;
    pagination;
}
exports.ViolationListResponse = ViolationListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ViolationEntity] }),
    __metadata("design:type", Array)
], ViolationListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], ViolationListResponse.prototype, "pagination", void 0);
class ViolationStats {
    total;
    open;
    acknowledged;
    inRemediation;
    remediated;
    critical;
    high;
}
exports.ViolationStats = ViolationStats;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Total violations" }),
    __metadata("design:type", Number)
], ViolationStats.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Open violations" }),
    __metadata("design:type", Number)
], ViolationStats.prototype, "open", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Acknowledged violations" }),
    __metadata("design:type", Number)
], ViolationStats.prototype, "acknowledged", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "In remediation" }),
    __metadata("design:type", Number)
], ViolationStats.prototype, "inRemediation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Remediated violations" }),
    __metadata("design:type", Number)
], ViolationStats.prototype, "remediated", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Critical violations" }),
    __metadata("design:type", Number)
], ViolationStats.prototype, "critical", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "High severity violations" }),
    __metadata("design:type", Number)
], ViolationStats.prototype, "high", void 0);
//# sourceMappingURL=violation.entity.js.map