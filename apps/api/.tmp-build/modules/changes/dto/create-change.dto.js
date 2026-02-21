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
exports.CompleteChangeDto = exports.UpdateChangeDto = exports.CreateChangeDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateChangeDto {
    title;
    description;
    reason;
    type;
    riskLevel;
    impactLevel;
    assigneeId;
    teamId;
    rollbackPlan;
    testPlan;
    plannedStart;
    plannedEnd;
    incidentIds;
}
exports.CreateChangeDto = CreateChangeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Upgrade database server to latest version" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Detailed steps for the upgrade..." }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Performance improvements and security patches" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["standard", "normal", "emergency"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["standard", "normal", "emergency"]),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["low", "medium", "high", "critical"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["low", "medium", "high", "critical"]),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "riskLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["low", "medium", "high", "critical"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["low", "medium", "high", "critical"]),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "impactLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "teamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "rollbackPlan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "testPlan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "plannedStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateChangeDto.prototype, "plannedEnd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], CreateChangeDto.prototype, "incidentIds", void 0);
class UpdateChangeDto {
    title;
    description;
    status;
    riskLevel;
    impactLevel;
    assigneeId;
    teamId;
    rollbackPlan;
    testPlan;
    plannedStart;
    plannedEnd;
    actualStart;
    actualEnd;
}
exports.UpdateChangeDto = UpdateChangeDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["draft", "requested", "assessing", "scheduled", "approved", "rejected", "implementing", "completed", "failed"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["draft", "requested", "assessing", "scheduled", "approved", "rejected", "implementing", "completed", "failed"]),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["low", "medium", "high", "critical"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["low", "medium", "high", "critical"]),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "riskLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["low", "medium", "high", "critical"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["low", "medium", "high", "critical"]),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "impactLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "teamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "rollbackPlan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "testPlan", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "plannedStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "plannedEnd", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "actualStart", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateChangeDto.prototype, "actualEnd", void 0);
class CompleteChangeDto {
    pirSummary;
    pirOutcome;
}
exports.CompleteChangeDto = CompleteChangeDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Post-implementation review summary" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteChangeDto.prototype, "pirSummary", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["successful", "partial", "failed"] }),
    (0, class_validator_1.IsEnum)(["successful", "partial", "failed"]),
    __metadata("design:type", String)
], CompleteChangeDto.prototype, "pirOutcome", void 0);
//# sourceMappingURL=create-change.dto.js.map