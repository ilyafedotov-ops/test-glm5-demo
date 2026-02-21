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
exports.TransitionIncidentDto = exports.ItilIncidentStatus = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
var ItilIncidentStatus;
(function (ItilIncidentStatus) {
    ItilIncidentStatus["NEW"] = "new";
    ItilIncidentStatus["ASSIGNED"] = "assigned";
    ItilIncidentStatus["IN_PROGRESS"] = "in_progress";
    ItilIncidentStatus["PENDING"] = "pending";
    ItilIncidentStatus["RESOLVED"] = "resolved";
    ItilIncidentStatus["CLOSED"] = "closed";
    ItilIncidentStatus["CANCELLED"] = "cancelled";
    ItilIncidentStatus["ESCALATED"] = "escalated";
})(ItilIncidentStatus || (exports.ItilIncidentStatus = ItilIncidentStatus = {}));
class TransitionIncidentDto {
    toStatus;
    reason;
    comment;
    assigneeId;
    teamId;
    pendingReason;
    onHoldUntil;
    resolutionSummary;
    closureCode;
    metadata;
    problemId;
    knowledgeArticleId;
}
exports.TransitionIncidentDto = TransitionIncidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: ItilIncidentStatus, description: "Target status for strict transition" }),
    (0, class_validator_1.IsEnum)(ItilIncidentStatus),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "toStatus", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional transition reason" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "reason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional transition comment" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "comment", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Assignee user ID update for this transition" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Team ID update for this transition" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "teamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Required when moving to pending" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "pendingReason", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional hold-until date for pending incidents" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "onHoldUntil", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Required when moving to resolved" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "resolutionSummary", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Required when moving to closed" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "closureCode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional metadata for downstream automation" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    (0, class_transformer_1.Type)(() => Object),
    __metadata("design:type", Object)
], TransitionIncidentDto.prototype, "metadata", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Link to problem when resolving (Problem Management)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "problemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Link to knowledge article when resolving (Knowledge Management)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransitionIncidentDto.prototype, "knowledgeArticleId", void 0);
//# sourceMappingURL=transition-incident.dto.js.map