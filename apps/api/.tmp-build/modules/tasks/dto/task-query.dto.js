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
exports.TaskQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const create_task_dto_1 = require("./create-task.dto");
class TaskQueryDto {
    page = 1;
    limit = 20;
    status;
    priority;
    assigneeId;
    incidentId;
    workflowId;
    teamId;
    violationId;
    policyId;
    sourceEntityId;
    sourceEntityType;
    systemRecordId;
    overdue;
    dueFrom;
    dueTo;
    search;
}
exports.TaskQueryDto = TaskQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Page number", default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TaskQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Items per page", default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], TaskQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by status", enum: create_task_dto_1.TaskStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_task_dto_1.TaskStatus),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by priority", enum: create_task_dto_1.TaskPriority }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_task_dto_1.TaskPriority),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by assignee ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by incident ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "incidentId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by workflow ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "workflowId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by team ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "teamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by violation ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "violationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by policy ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "policyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by source entity ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "sourceEntityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by source entity type" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "sourceEntityType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by unified system record ID (<entityType>:<entityId>)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "systemRecordId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter overdue tasks" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    (0, class_transformer_1.Type)(() => Boolean),
    __metadata("design:type", Boolean)
], TaskQueryDto.prototype, "overdue", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by due date from (ISO string)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "dueFrom", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by due date to (ISO string)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "dueTo", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Search in title and description" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TaskQueryDto.prototype, "search", void 0);
//# sourceMappingURL=task-query.dto.js.map