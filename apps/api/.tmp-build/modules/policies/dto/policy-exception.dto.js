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
exports.ReviewPolicyExceptionDto = exports.CreatePolicyExceptionDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePolicyExceptionDto {
    title;
    justification;
    expiresAt;
}
exports.CreatePolicyExceptionDto = CreatePolicyExceptionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Short title for the policy exception" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreatePolicyExceptionDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Business and technical justification" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreatePolicyExceptionDto.prototype, "justification", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional expiration date for the exception" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreatePolicyExceptionDto.prototype, "expiresAt", void 0);
class ReviewPolicyExceptionDto {
    note;
}
exports.ReviewPolicyExceptionDto = ReviewPolicyExceptionDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Approval/rejection note" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReviewPolicyExceptionDto.prototype, "note", void 0);
//# sourceMappingURL=policy-exception.dto.js.map