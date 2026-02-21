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
exports.RunReportDto = exports.REPORT_TYPES = void 0;
const class_validator_1 = require("class-validator");
const swagger_1 = require("@nestjs/swagger");
exports.REPORT_TYPES = [
    "incident_summary",
    "sla_compliance",
    "user_activity",
    "audit_log",
    "itil_kpi",
    "incident_lifecycle",
    "workflow_kpi",
];
class RunReportDto {
    type;
    format;
    parameters;
    scheduleFrequency;
    scheduleStartAt;
}
exports.RunReportDto = RunReportDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: exports.REPORT_TYPES }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.IsEnum)(exports.REPORT_TYPES),
    __metadata("design:type", String)
], RunReportDto.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["csv", "json"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["csv", "json"]),
    __metadata("design:type", String)
], RunReportDto.prototype, "format", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)(),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], RunReportDto.prototype, "parameters", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ enum: ["none", "daily", "weekly", "monthly"] }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(["none", "daily", "weekly", "monthly"]),
    __metadata("design:type", String)
], RunReportDto.prototype, "scheduleFrequency", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Optional ISO datetime when schedule becomes active" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], RunReportDto.prototype, "scheduleStartAt", void 0);
//# sourceMappingURL=run-report.dto.js.map