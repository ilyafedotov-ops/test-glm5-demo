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
exports.UpdateProblemDto = exports.CreateProblemDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateProblemDto {
    title;
    description;
    priority;
    impact;
    urgency;
    assigneeId;
    teamId;
    incidentIds;
    isKnownError;
    rootCause;
    workaround;
    detectedAt;
}
exports.CreateProblemDto = CreateProblemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Database connectivity issues in production" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Multiple incidents reported..." }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["critical", "high", "medium", "low"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["critical", "high", "medium", "low"]),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["critical", "high", "medium", "low"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["critical", "high", "medium", "low"]),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "impact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["critical", "high", "medium", "low"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["critical", "high", "medium", "low"]),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "urgency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "teamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], CreateProblemDto.prototype, "incidentIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateProblemDto.prototype, "isKnownError", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "rootCause", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "workaround", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateProblemDto.prototype, "detectedAt", void 0);
class UpdateProblemDto {
    title;
    description;
    status;
    priority;
    impact;
    urgency;
    assigneeId;
    teamId;
    isKnownError;
    rootCause;
    workaround;
    impactAssessment;
}
exports.UpdateProblemDto = UpdateProblemDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["new", "investigating", "known_error", "root_cause_identified", "resolved", "closed"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["new", "investigating", "known_error", "root_cause_identified", "resolved", "closed"]),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["critical", "high", "medium", "low"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["critical", "high", "medium", "low"]),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["critical", "high", "medium", "low"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["critical", "high", "medium", "low"]),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "impact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["critical", "high", "medium", "low"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["critical", "high", "medium", "low"]),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "urgency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "teamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateProblemDto.prototype, "isKnownError", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "rootCause", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "workaround", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateProblemDto.prototype, "impactAssessment", void 0);
//# sourceMappingURL=create-problem.dto.js.map