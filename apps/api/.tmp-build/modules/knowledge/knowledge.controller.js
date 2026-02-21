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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/jwt-auth.guard");
const permissions_guard_1 = require("@/modules/auth/guards/permissions.guard");
const permissions_decorator_1 = require("@/modules/auth/decorators/permissions.decorator");
const audited_decorator_1 = require("@/modules/audit/decorators/audited.decorator");
const knowledge_service_1 = require("./knowledge.service");
const knowledge_dto_1 = require("./dto/knowledge.dto");
let KnowledgeController = class KnowledgeController {
    knowledgeService;
    constructor(knowledgeService) {
        this.knowledgeService = knowledgeService;
    }
    create(req, dto) {
        return this.knowledgeService.create(req.user.organizationId, req.user.userId, dto);
    }
    findAll(req, query) {
        return this.knowledgeService.findAll(req.user.organizationId, query);
    }
    search(req, query, limit) {
        return this.knowledgeService.search(req.user.organizationId, query, limit ? parseInt(limit) : 10);
    }
    findOne(req, id) {
        return this.knowledgeService.findOne(req.user.organizationId, id);
    }
    findVersions(req, id) {
        return this.knowledgeService.findVersions(req.user.organizationId, id);
    }
    update(req, id, dto) {
        return this.knowledgeService.update(req.user.organizationId, id, req.user.userId, dto);
    }
    publish(req, id) {
        return this.knowledgeService.publish(req.user.organizationId, id, req.user.userId);
    }
    archive(req, id) {
        return this.knowledgeService.archive(req.user.organizationId, id, req.user.userId);
    }
    markHelpful(req, id) {
        return this.knowledgeService.markHelpful(req.user.organizationId, id);
    }
    markNotHelpful(req, id) {
        return this.knowledgeService.markNotHelpful(req.user.organizationId, id);
    }
    revert(req, id, dto) {
        return this.knowledgeService.revertToVersion(req.user.organizationId, id, req.user.userId, dto);
    }
};
exports.KnowledgeController = KnowledgeController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: "Create a knowledge article" }),
    (0, permissions_decorator_1.RequirePermissions)("knowledge:write"),
    (0, audited_decorator_1.Audited)({
        action: "knowledge.create",
        resource: "knowledgeArticle",
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, knowledge_dto_1.CreateKnowledgeArticleDto]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "List all knowledge articles" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)("search"),
    (0, swagger_1.ApiOperation)({ summary: "Search knowledge articles" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("q")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "search", null);
__decorate([
    (0, common_1.Get)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Get knowledge article details" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)(":id/versions"),
    (0, swagger_1.ApiOperation)({ summary: "List article version history" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "findVersions", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, swagger_1.ApiOperation)({ summary: "Update knowledge article" }),
    (0, permissions_decorator_1.RequirePermissions)("knowledge:update"),
    (0, audited_decorator_1.Audited)({
        action: "knowledge.update",
        resource: "knowledgeArticle",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, knowledge_dto_1.UpdateKnowledgeArticleDto]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(":id/publish"),
    (0, swagger_1.ApiOperation)({ summary: "Publish knowledge article" }),
    (0, permissions_decorator_1.RequirePermissions)("knowledge:update"),
    (0, audited_decorator_1.Audited)({
        action: "knowledge.publish",
        resource: "knowledgeArticle",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)(":id/archive"),
    (0, swagger_1.ApiOperation)({ summary: "Archive knowledge article" }),
    (0, permissions_decorator_1.RequirePermissions)("knowledge:update"),
    (0, audited_decorator_1.Audited)({
        action: "knowledge.archive",
        resource: "knowledgeArticle",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "archive", null);
__decorate([
    (0, common_1.Post)(":id/helpful"),
    (0, swagger_1.ApiOperation)({ summary: "Mark article as helpful" }),
    (0, permissions_decorator_1.RequirePermissions)("knowledge:update"),
    (0, audited_decorator_1.Audited)({
        action: "knowledge.mark_helpful",
        resource: "knowledgeArticle",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "markHelpful", null);
__decorate([
    (0, common_1.Post)(":id/not-helpful"),
    (0, swagger_1.ApiOperation)({ summary: "Mark article as not helpful" }),
    (0, permissions_decorator_1.RequirePermissions)("knowledge:update"),
    (0, audited_decorator_1.Audited)({
        action: "knowledge.mark_not_helpful",
        resource: "knowledgeArticle",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "markNotHelpful", null);
__decorate([
    (0, common_1.Post)(":id/revert"),
    (0, swagger_1.ApiOperation)({ summary: "Revert article to a previous version" }),
    (0, permissions_decorator_1.RequirePermissions)("knowledge:update"),
    (0, audited_decorator_1.Audited)({
        action: "knowledge.revert",
        resource: "knowledgeArticle",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, knowledge_dto_1.RevertKnowledgeArticleVersionDto]),
    __metadata("design:returntype", void 0)
], KnowledgeController.prototype, "revert", null);
exports.KnowledgeController = KnowledgeController = __decorate([
    (0, swagger_1.ApiTags)("knowledge"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("knowledge:read"),
    (0, common_1.Controller)("knowledge"),
    __metadata("design:paramtypes", [knowledge_service_1.KnowledgeService])
], KnowledgeController);
//# sourceMappingURL=knowledge.controller.js.map