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
exports.CreateViolationDto = exports.ViolationStatus = exports.ViolationSeverity = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var ViolationSeverity;
(function (ViolationSeverity) {
    ViolationSeverity["LOW"] = "low";
    ViolationSeverity["MEDIUM"] = "medium";
    ViolationSeverity["HIGH"] = "high";
    ViolationSeverity["CRITICAL"] = "critical";
})(ViolationSeverity || (exports.ViolationSeverity = ViolationSeverity = {}));
var ViolationStatus;
(function (ViolationStatus) {
    ViolationStatus["OPEN"] = "open";
    ViolationStatus["ACKNOWLEDGED"] = "acknowledged";
    ViolationStatus["IN_REMEDIATION"] = "in_remediation";
    ViolationStatus["REMEDIATED"] = "remediated";
    ViolationStatus["CLOSED"] = "closed";
    ViolationStatus["FALSE_POSITIVE"] = "false_positive";
})(ViolationStatus || (exports.ViolationStatus = ViolationStatus = {}));
class CreateViolationDto {
    policyId;
    entityId;
    entityType;
    severity;
    title;
    description;
    remediation;
    assigneeId;
    metadata;
}
exports.CreateViolationDto = CreateViolationDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Policy ID that was violated" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateViolationDto.prototype, "policyId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Entity ID where violation occurred" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateViolationDto.prototype, "entityId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Entity type (e.g., incident, user, system)" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateViolationDto.prototype, "entityType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Violation severity", enum: ViolationSeverity, default: ViolationSeverity.MEDIUM }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ViolationSeverity),
    __metadata("design:type", String)
], CreateViolationDto.prototype, "severity", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Violation title" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateViolationDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Detailed description of the violation" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateViolationDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Remediation steps" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateViolationDto.prototype, "remediation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Assignee user ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateViolationDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Additional metadata" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateViolationDto.prototype, "metadata", void 0);
//# sourceMappingURL=create-violation.dto.js.map