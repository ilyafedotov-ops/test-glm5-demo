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
exports.RevertKnowledgeArticleVersionDto = exports.UpdateKnowledgeArticleDto = exports.CreateKnowledgeArticleDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateKnowledgeArticleDto {
    title;
    content;
    category;
    tags;
}
exports.CreateKnowledgeArticleDto = CreateKnowledgeArticleDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "How to reset password" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKnowledgeArticleDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Step-by-step guide to reset your password..." }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateKnowledgeArticleDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ["general", "howto", "troubleshooting", "reference"] }),
    (0, class_validator_1.IsEnum)(["general", "howto", "troubleshooting", "reference"]),
    __metadata("design:type", String)
], CreateKnowledgeArticleDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], CreateKnowledgeArticleDto.prototype, "tags", void 0);
class UpdateKnowledgeArticleDto {
    title;
    content;
    category;
    tags;
    changeSummary;
}
exports.UpdateKnowledgeArticleDto = UpdateKnowledgeArticleDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateKnowledgeArticleDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateKnowledgeArticleDto.prototype, "content", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["general", "howto", "troubleshooting", "reference"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["general", "howto", "troubleshooting", "reference"]),
    __metadata("design:type", String)
], UpdateKnowledgeArticleDto.prototype, "category", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    __metadata("design:type", Array)
], UpdateKnowledgeArticleDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Short summary of what changed in this revision" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], UpdateKnowledgeArticleDto.prototype, "changeSummary", void 0);
class RevertKnowledgeArticleVersionDto {
    versionId;
    changeSummary;
}
exports.RevertKnowledgeArticleVersionDto = RevertKnowledgeArticleVersionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Version record ID to revert to" }),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], RevertKnowledgeArticleVersionDto.prototype, "versionId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Reason for revert operation" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RevertKnowledgeArticleVersionDto.prototype, "changeSummary", void 0);
//# sourceMappingURL=knowledge.dto.js.map