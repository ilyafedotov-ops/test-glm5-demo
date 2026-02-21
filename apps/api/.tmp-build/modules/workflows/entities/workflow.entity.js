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
exports.WorkflowListResponse = exports.WorkflowEntity = void 0;
const swagger_1 = require("@nestjs/swagger");
const system_links_1 = require("@/common/system-links/system-links");
class WorkflowEntity {
    id;
    name;
    type;
    status;
    entityId;
    entityType;
    organizationId;
    currentStepId;
    steps;
    context;
    incidentId;
    completedAt;
    createdAt;
    updatedAt;
    systemRecordId;
    traceContext;
    relatedRecords;
}
exports.WorkflowEntity = WorkflowEntity;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Workflow ID" }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Workflow name" }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Workflow type" }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Workflow status" }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Entity ID" }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Entity type" }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Organization ID" }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "organizationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Current step ID" }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "currentStepId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Workflow steps", type: "array" }),
    __metadata("design:type", Array)
], WorkflowEntity.prototype, "steps", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Workflow context data" }),
    __metadata("design:type", Object)
], WorkflowEntity.prototype, "context", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Incident ID" }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "incidentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Completed at timestamp" }),
    __metadata("design:type", Date)
], WorkflowEntity.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Created at timestamp" }),
    __metadata("design:type", Date)
], WorkflowEntity.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Updated at timestamp" }),
    __metadata("design:type", Date)
], WorkflowEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Globally unique system record identifier (<entityType>:<entityId>)",
        example: "workflow:8e8d4efa-4d8f-43fd-9ebf-4f3e06cf60e4",
    }),
    __metadata("design:type", String)
], WorkflowEntity.prototype, "systemRecordId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: system_links_1.TraceContext,
        description: "Trace fields used to correlate records across workflows, tasks, compliance, and audit logs",
    }),
    __metadata("design:type", system_links_1.TraceContext)
], WorkflowEntity.prototype, "traceContext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [system_links_1.RelatedRecord],
        description: "Cross-domain records related to this workflow",
    }),
    __metadata("design:type", Array)
], WorkflowEntity.prototype, "relatedRecords", void 0);
class WorkflowListResponse {
    data;
    pagination;
}
exports.WorkflowListResponse = WorkflowListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [WorkflowEntity] }),
    __metadata("design:type", Array)
], WorkflowListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], WorkflowListResponse.prototype, "pagination", void 0);
//# sourceMappingURL=workflow.entity.js.map