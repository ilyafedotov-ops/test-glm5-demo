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
exports.UpdateConfigurationItemRelationshipsDto = exports.ConfigurationItemRelationshipDto = exports.LinkConfigurationItemsDto = exports.QueryConfigurationItemsDto = exports.UpdateConfigurationItemDto = exports.CreateConfigurationItemDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
const CONFIGURATION_ITEM_TYPES = [
    "application",
    "service",
    "database",
    "infrastructure",
    "endpoint",
    "other",
];
const CONFIGURATION_ITEM_STATUSES = ["active", "maintenance", "retired"];
const CONFIGURATION_ITEM_CRITICALITY = ["low", "medium", "high", "critical"];
const CONFIGURATION_ITEM_RELATIONSHIP_TYPES = [
    "depends_on",
    "hosted_on",
    "connects_to",
    "parent_of",
    "child_of",
];
class CreateConfigurationItemDto {
    name;
    type;
    status;
    criticality;
    environment;
    ownerTeam;
    description;
    metadata;
}
exports.CreateConfigurationItemDto = CreateConfigurationItemDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Configuration item name", example: "Payments API" }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(255),
    __metadata("design:type", String)
], CreateConfigurationItemDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: CONFIGURATION_ITEM_TYPES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CONFIGURATION_ITEM_TYPES),
    __metadata("design:type", String)
], CreateConfigurationItemDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: CONFIGURATION_ITEM_STATUSES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CONFIGURATION_ITEM_STATUSES),
    __metadata("design:type", String)
], CreateConfigurationItemDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: CONFIGURATION_ITEM_CRITICALITY }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CONFIGURATION_ITEM_CRITICALITY),
    __metadata("design:type", String)
], CreateConfigurationItemDto.prototype, "criticality", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Target environment", example: "production" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConfigurationItemDto.prototype, "environment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Owning team", example: "Platform Engineering" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConfigurationItemDto.prototype, "ownerTeam", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Configuration item description" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateConfigurationItemDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Additional metadata as JSON object" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateConfigurationItemDto.prototype, "metadata", void 0);
class UpdateConfigurationItemDto extends (0, swagger_1.PartialType)(CreateConfigurationItemDto) {
}
exports.UpdateConfigurationItemDto = UpdateConfigurationItemDto;
class QueryConfigurationItemsDto {
    type;
    status;
    search;
}
exports.QueryConfigurationItemsDto = QueryConfigurationItemsDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by type", enum: CONFIGURATION_ITEM_TYPES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CONFIGURATION_ITEM_TYPES),
    __metadata("design:type", String)
], QueryConfigurationItemsDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Filter by status", enum: CONFIGURATION_ITEM_STATUSES }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(CONFIGURATION_ITEM_STATUSES),
    __metadata("design:type", String)
], QueryConfigurationItemsDto.prototype, "status", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Search by name", example: "payments" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], QueryConfigurationItemsDto.prototype, "search", void 0);
class LinkConfigurationItemsDto {
    configurationItemIds;
}
exports.LinkConfigurationItemsDto = LinkConfigurationItemsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: "Configuration item IDs to link to incident" }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], LinkConfigurationItemsDto.prototype, "configurationItemIds", void 0);
class ConfigurationItemRelationshipDto {
    targetConfigurationItemId;
    relationshipType;
    note;
}
exports.ConfigurationItemRelationshipDto = ConfigurationItemRelationshipDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Target configuration item ID" }),
    (0, class_validator_1.IsUUID)("4"),
    __metadata("design:type", String)
], ConfigurationItemRelationshipDto.prototype, "targetConfigurationItemId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: CONFIGURATION_ITEM_RELATIONSHIP_TYPES }),
    (0, class_validator_1.IsIn)(CONFIGURATION_ITEM_RELATIONSHIP_TYPES),
    __metadata("design:type", String)
], ConfigurationItemRelationshipDto.prototype, "relationshipType", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional relationship note" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ConfigurationItemRelationshipDto.prototype, "note", void 0);
class UpdateConfigurationItemRelationshipsDto {
    relationships;
}
exports.UpdateConfigurationItemRelationshipsDto = UpdateConfigurationItemRelationshipsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ type: [ConfigurationItemRelationshipDto] }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ConfigurationItemRelationshipDto),
    __metadata("design:type", Array)
], UpdateConfigurationItemRelationshipsDto.prototype, "relationships", void 0);
//# sourceMappingURL=configuration-item.dto.js.map