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
exports.TaskStats = exports.TaskListResponse = exports.TaskEntity = void 0;
const swagger_1 = require("@nestjs/swagger");
const system_links_1 = require("@/common/system-links/system-links");
class TaskEntity {
    id;
    title;
    description;
    status;
    priority;
    assigneeId;
    assigneeName;
    reporterId;
    reporterName;
    incidentId;
    incidentTitle;
    workflowId;
    violationId;
    policyId;
    sourceEntityId;
    sourceEntityType;
    teamId;
    teamName;
    dueAt;
    startedAt;
    completedAt;
    estimatedMinutes;
    actualMinutes;
    tags;
    metadata;
    slaStatus;
    timeRemaining;
    createdAt;
    updatedAt;
    systemRecordId;
    traceContext;
    relatedRecords;
}
exports.TaskEntity = TaskEntity;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Task ID" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Task title" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Task description" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Task status" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Task priority" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Assignee user ID" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Assignee name" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "assigneeName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Reporter user ID" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "reporterId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Reporter name" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "reporterName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Incident ID" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "incidentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Incident title" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "incidentTitle", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Workflow ID" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "workflowId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Violation ID" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "violationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Policy ID" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "policyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Source entity ID that originated this task" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "sourceEntityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Source entity type that originated this task" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "sourceEntityType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Team ID" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "teamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Team name" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "teamName", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Due date" }),
    __metadata("design:type", Date)
], TaskEntity.prototype, "dueAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Started at timestamp" }),
    __metadata("design:type", Date)
], TaskEntity.prototype, "startedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Completed at timestamp" }),
    __metadata("design:type", Date)
], TaskEntity.prototype, "completedAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Estimated time in minutes" }),
    __metadata("design:type", Number)
], TaskEntity.prototype, "estimatedMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Actual time in minutes" }),
    __metadata("design:type", Number)
], TaskEntity.prototype, "actualMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Tags" }),
    __metadata("design:type", Array)
], TaskEntity.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Additional metadata" }),
    __metadata("design:type", Object)
], TaskEntity.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "SLA status" }),
    __metadata("design:type", String)
], TaskEntity.prototype, "slaStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Time remaining in minutes" }),
    __metadata("design:type", Number)
], TaskEntity.prototype, "timeRemaining", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Created at timestamp" }),
    __metadata("design:type", Date)
], TaskEntity.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Updated at timestamp" }),
    __metadata("design:type", Date)
], TaskEntity.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Globally unique system record identifier (<entityType>:<entityId>)",
        example: "task:7f96f9d2-08e1-4f57-bd47-44918cc32296",
    }),
    __metadata("design:type", String)
], TaskEntity.prototype, "systemRecordId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: system_links_1.TraceContext,
        description: "Trace fields used to correlate records across workflows, tasks, compliance, and audit logs",
    }),
    __metadata("design:type", system_links_1.TraceContext)
], TaskEntity.prototype, "traceContext", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        type: [system_links_1.RelatedRecord],
        description: "Cross-domain records related to this task",
    }),
    __metadata("design:type", Array)
], TaskEntity.prototype, "relatedRecords", void 0);
class TaskListResponse {
    data;
    pagination;
}
exports.TaskListResponse = TaskListResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [TaskEntity] }),
    __metadata("design:type", Array)
], TaskListResponse.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiProperty)(),
    __metadata("design:type", Object)
], TaskListResponse.prototype, "pagination", void 0);
class TaskStats {
    total;
    pending;
    inProgress;
    completed;
    overdue;
    critical;
    high;
    avgCompletionTime;
}
exports.TaskStats = TaskStats;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Total tasks" }),
    __metadata("design:type", Number)
], TaskStats.prototype, "total", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Pending tasks" }),
    __metadata("design:type", Number)
], TaskStats.prototype, "pending", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "In progress tasks" }),
    __metadata("design:type", Number)
], TaskStats.prototype, "inProgress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Completed tasks" }),
    __metadata("design:type", Number)
], TaskStats.prototype, "completed", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Overdue tasks" }),
    __metadata("design:type", Number)
], TaskStats.prototype, "overdue", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Critical priority tasks" }),
    __metadata("design:type", Number)
], TaskStats.prototype, "critical", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "High priority tasks" }),
    __metadata("design:type", Number)
], TaskStats.prototype, "high", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Average completion time in minutes" }),
    __metadata("design:type", Number)
], TaskStats.prototype, "avgCompletionTime", void 0);
//# sourceMappingURL=task.entity.js.map