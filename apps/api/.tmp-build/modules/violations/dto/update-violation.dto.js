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
exports.AssignViolationDto = exports.RemediateViolationDto = exports.AcknowledgeViolationDto = exports.UpdateViolationDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const create_violation_dto_1 = require("./create-violation.dto");
class UpdateViolationDto extends (0, swagger_1.PartialType)(create_violation_dto_1.CreateViolationDto) {
    status;
}
exports.UpdateViolationDto = UpdateViolationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Violation status", enum: create_violation_dto_1.ViolationStatus }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(create_violation_dto_1.ViolationStatus),
    __metadata("design:type", String)
], UpdateViolationDto.prototype, "status", void 0);
class AcknowledgeViolationDto {
    comment;
}
exports.AcknowledgeViolationDto = AcknowledgeViolationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Acknowledgment comment" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AcknowledgeViolationDto.prototype, "comment", void 0);
class RemediateViolationDto {
    remediation;
    evidence;
}
exports.RemediateViolationDto = RemediateViolationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Remediation details" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RemediateViolationDto.prototype, "remediation", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Evidence of remediation" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RemediateViolationDto.prototype, "evidence", void 0);
class AssignViolationDto {
    assigneeId;
    note;
}
exports.AssignViolationDto = AssignViolationDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "User ID to assign" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignViolationDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Assignment note" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AssignViolationDto.prototype, "note", void 0);
//# sourceMappingURL=update-violation.dto.js.map