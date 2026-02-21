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
exports.FulfillServiceRequestDto = exports.RejectServiceRequestDto = exports.ApproveServiceRequestDto = exports.CreateServiceRequestDto = exports.CreateServiceItemDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateServiceItemDto {
    name;
    description;
    category;
    formSchema;
    approvalRequired;
}
exports.CreateServiceItemDto = CreateServiceItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "New Laptop" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Standard company laptop for employees" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["hardware", "software", "access", "general"] }),
    (0, class_validator_1.IsEnum)(["hardware", "software", "access", "general"]),
    __metadata("design:type", String)
], CreateServiceItemDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateServiceItemDto.prototype, "formSchema", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateServiceItemDto.prototype, "approvalRequired", void 0);
class CreateServiceRequestDto {
    serviceItemId;
    title;
    description;
    formData;
}
exports.CreateServiceRequestDto = CreateServiceRequestDto;
__decorate([
    (0, swagger_1.ApiProperty)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "serviceItemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateServiceRequestDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateServiceRequestDto.prototype, "formData", void 0);
class ApproveServiceRequestDto {
    notes;
}
exports.ApproveServiceRequestDto = ApproveServiceRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional approval notes" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ApproveServiceRequestDto.prototype, "notes", void 0);
class RejectServiceRequestDto {
    reason;
}
exports.RejectServiceRequestDto = RejectServiceRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional rejection reason" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RejectServiceRequestDto.prototype, "reason", void 0);
class FulfillServiceRequestDto {
    notes;
}
exports.FulfillServiceRequestDto = FulfillServiceRequestDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional fulfillment notes" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], FulfillServiceRequestDto.prototype, "notes", void 0);
//# sourceMappingURL=service-catalog.dto.js.map