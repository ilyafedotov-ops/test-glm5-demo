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
exports.CreateWorkflowDto = exports.WorkflowStepDto = exports.WorkflowStatus = exports.WorkflowType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var WorkflowType;
(function (WorkflowType) {
    WorkflowType["INCIDENT_ESCALATION"] = "incident_escalation";
    WorkflowType["APPROVAL"] = "approval";
    WorkflowType["CHANGE_REQUEST"] = "change_request";
    WorkflowType["ONBOARDING"] = "onboarding";
    WorkflowType["OFFBOARDING"] = "offboarding";
    WorkflowType["REVIEW"] = "review";
})(WorkflowType || (exports.WorkflowType = WorkflowType = {}));
var WorkflowStatus;
(function (WorkflowStatus) {
    WorkflowStatus["PENDING"] = "pending";
    WorkflowStatus["IN_PROGRESS"] = "in_progress";
    WorkflowStatus["COMPLETED"] = "completed";
    WorkflowStatus["CANCELLED"] = "cancelled";
    WorkflowStatus["FAILED"] = "failed";
})(WorkflowStatus || (exports.WorkflowStatus = WorkflowStatus = {}));
class WorkflowStepDto {
    id;
    name;
    description;
    type;
    assignee;
    config;
    nextSteps;
}
exports.WorkflowStepDto = WorkflowStepDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Step identifier" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkflowStepDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Step name" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkflowStepDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Step description" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkflowStepDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Step type", enum: ["auto", "manual", "approval"] }),
    (0, class_validator_1.IsEnum)(["auto", "manual", "approval"]),
    __metadata("design:type", String)
], WorkflowStepDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Assigned user or role" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], WorkflowStepDto.prototype, "assignee", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Step configuration" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], WorkflowStepDto.prototype, "config", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Next step transitions" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], WorkflowStepDto.prototype, "nextSteps", void 0);
class CreateWorkflowDto {
    name;
    type;
    entityId;
    entityType;
    incidentId;
    steps;
    context;
}
exports.CreateWorkflowDto = CreateWorkflowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Workflow name" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Workflow type", enum: WorkflowType }),
    (0, class_validator_1.IsEnum)(WorkflowType),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Entity ID this workflow is for" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Entity type (e.g., incident, user)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Incident ID to link" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateWorkflowDto.prototype, "incidentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Workflow steps", type: [WorkflowStepDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => WorkflowStepDto),
    __metadata("design:type", Array)
], CreateWorkflowDto.prototype, "steps", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Initial workflow context data" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateWorkflowDto.prototype, "context", void 0);
//# sourceMappingURL=create-workflow.dto.js.map