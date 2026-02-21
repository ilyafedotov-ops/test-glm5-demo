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
exports.ViolationQueryDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const create_violation_dto_1 = require("./create-violation.dto");
class ViolationQueryDto {
    page = 1;
    limit = 20;
    status;
    severity;
    policyId;
    assigneeId;
    entityId;
    entityType;
    systemRecordId;
    search;
    detectedAfter;
    detectedBefore;
}
exports.ViolationQueryDto = ViolationQueryDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Page number", default: 1 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ViolationQueryDto.prototype, "page", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Items per page", default: 20 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    __metadata("design:type", Number)
], ViolationQueryDto.prototype, "limit", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by status", enum: create_violation_dto_1.ViolationStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_violation_dto_1.ViolationStatus),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by severity", enum: create_violation_dto_1.ViolationSeverity }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_violation_dto_1.ViolationSeverity),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by policy ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "policyId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by assignee ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by entity ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by entity type" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by unified system record ID (<entityType>:<entityId>)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "systemRecordId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Search in title and description" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "search", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Detected after date (ISO string)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "detectedAfter", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Detected before date (ISO string)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ViolationQueryDto.prototype, "detectedBefore", void 0);
//# sourceMappingURL=violation-query.dto.js.map