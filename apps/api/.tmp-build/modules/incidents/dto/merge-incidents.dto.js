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
exports.MergeIncidentsDto = exports.QueryIncidentDuplicatesDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class QueryIncidentDuplicatesDto {
    limit = 5;
}
exports.QueryIncidentDuplicatesDto = QueryIncidentDuplicatesDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Maximum number of duplicate candidates", default: 5 }),
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(20),
    __metadata("design:type", Number)
], QueryIncidentDuplicatesDto.prototype, "limit", void 0);
class MergeIncidentsDto {
    targetIncidentId;
    sourceIncidentIds;
    reason;
}
exports.MergeIncidentsDto = MergeIncidentsDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Target incident to keep" }),
    (0, class_validator_1.IsUUID)("4"),
    __metadata("design:type", String)
], MergeIncidentsDto.prototype, "targetIncidentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: [String], description: "Incidents to merge into target" }),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], MergeIncidentsDto.prototype, "sourceIncidentIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional merge reason for audit trail" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MergeIncidentsDto.prototype, "reason", void 0);
//# sourceMappingURL=merge-incidents.dto.js.map