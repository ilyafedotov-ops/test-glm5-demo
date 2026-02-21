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
exports.CreateIncidentDto = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
class CreateIncidentDto {
    title;
    description;
    priority;
    impact;
    urgency;
    categoryId;
    teamId;
    assigneeId;
    channel;
    tags;
    dueAt;
    configurationItemIds;
    problemId;
    isMajorIncident;
}
exports.CreateIncidentDto = CreateIncidentDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Production API latency spike" }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "title", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: "Users reporting 5+ second response times..." }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["critical", "high", "medium", "low"], description: "Priority (calculated from impact x urgency if both provided)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["critical", "high", "medium", "low"]),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "priority", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["critical", "high", "medium", "low"], description: "Impact level for priority matrix" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["critical", "high", "medium", "low"]),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "impact", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["critical", "high", "medium", "low"], description: "Urgency level for priority matrix" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["critical", "high", "medium", "low"]),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "urgency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Incident category ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "categoryId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Team ID to assign" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "teamId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Assignee user ID" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "assigneeId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["portal", "email", "phone", "chat", "api"], description: "Channel through which incident was reported" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["portal", "email", "phone", "chat", "api"]),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "channel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: "Tags for categorization" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateIncidentDto.prototype, "tags", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Due date (ISO string)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "dueAt", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ type: [String], description: "Configuration Item IDs affected" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], CreateIncidentDto.prototype, "configurationItemIds", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Link to existing problem (if creating from known error context)" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateIncidentDto.prototype, "problemId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Mark as major incident for high-impact events" }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Boolean)
], CreateIncidentDto.prototype, "isMajorIncident", void 0);
//# sourceMappingURL=create-incident.dto.js.map