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
exports.RollbackWorkflowDto = exports.CancelWorkflowDto = exports.AdvanceWorkflowDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class AdvanceWorkflowDto {
    action;
    comment;
    data;
    nextStepId;
}
exports.AdvanceWorkflowDto = AdvanceWorkflowDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Action to take (approve, reject, skip, retry)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdvanceWorkflowDto.prototype, "action", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Comment for this action" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdvanceWorkflowDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Additional data for the transition" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], AdvanceWorkflowDto.prototype, "data", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Next step ID to transition to (for branching workflows)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AdvanceWorkflowDto.prototype, "nextStepId", void 0);
class CancelWorkflowDto {
    reason;
}
exports.CancelWorkflowDto = CancelWorkflowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Reason for cancellation" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CancelWorkflowDto.prototype, "reason", void 0);
class RollbackWorkflowDto {
    targetStepId;
    reason;
}
exports.RollbackWorkflowDto = RollbackWorkflowDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Step ID to rollback to" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RollbackWorkflowDto.prototype, "targetStepId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Reason for rollback" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RollbackWorkflowDto.prototype, "reason", void 0);
//# sourceMappingURL=advance-workflow.dto.js.map