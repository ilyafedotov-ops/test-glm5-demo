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
exports.ReopenTaskDto = exports.CompleteTaskDto = exports.StartTaskDto = exports.AssignTaskDto = exports.UpdateTaskDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const create_task_dto_1 = require("./create-task.dto");
class UpdateTaskDto extends (0, swagger_1.PartialType)(create_task_dto_1.CreateTaskDto) {
}
exports.UpdateTaskDto = UpdateTaskDto;
class AssignTaskDto {
    assigneeId;
}
exports.AssignTaskDto = AssignTaskDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "User ID to assign", required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignTaskDto.prototype, "assigneeId", void 0);
class StartTaskDto {
    note;
}
exports.StartTaskDto = StartTaskDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Note about starting the task" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], StartTaskDto.prototype, "note", void 0);
class CompleteTaskDto {
    actualMinutes;
    note;
}
exports.CompleteTaskDto = CompleteTaskDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Actual time spent in minutes" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], CompleteTaskDto.prototype, "actualMinutes", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Completion note" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CompleteTaskDto.prototype, "note", void 0);
class ReopenTaskDto {
    reason;
}
exports.ReopenTaskDto = ReopenTaskDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Reason for reopening" }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ReopenTaskDto.prototype, "reason", void 0);
//# sourceMappingURL=update-task.dto.js.map