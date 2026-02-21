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
exports.ServiceCatalogController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const jwt_auth_guard_1 = require("@/modules/auth/jwt-auth.guard");
const permissions_guard_1 = require("@/modules/auth/guards/permissions.guard");
const permissions_decorator_1 = require("@/modules/auth/decorators/permissions.decorator");
const audited_decorator_1 = require("@/modules/audit/decorators/audited.decorator");
const service_catalog_service_1 = require("./service-catalog.service");
const service_catalog_dto_1 = require("./dto/service-catalog.dto");
let ServiceCatalogController = class ServiceCatalogController {
    serviceCatalogService;
    constructor(serviceCatalogService) {
        this.serviceCatalogService = serviceCatalogService;
    }
    createItem(req, dto) {
        return this.serviceCatalogService.createItem(req.user.organizationId, req.user.userId, dto);
    }
    findAllItems(req, category) {
        return this.serviceCatalogService.findAllItems(req.user.organizationId, category);
    }
    findOneItem(req, id) {
        return this.serviceCatalogService.findOneItem(req.user.organizationId, id);
    }
    createRequest(req, dto) {
        return this.serviceCatalogService.createRequest(req.user.organizationId, req.user.userId, dto);
    }
    findAllRequests(req, query) {
        return this.serviceCatalogService.findAllRequests(req.user.organizationId, query);
    }
    findOneRequest(req, id) {
        return this.serviceCatalogService.findOneRequest(req.user.organizationId, id);
    }
    approveRequest(req, id, body) {
        return this.serviceCatalogService.approveRequest(req.user.organizationId, id, req.user.userId, body.notes);
    }
    rejectRequest(req, id, body) {
        return this.serviceCatalogService.rejectRequest(req.user.organizationId, id, req.user.userId, body.reason);
    }
    fulfillRequest(req, id, body) {
        return this.serviceCatalogService.fulfillRequest(req.user.organizationId, id, req.user.userId, body.notes);
    }
};
exports.ServiceCatalogController = ServiceCatalogController;
__decorate([
    (0, common_1.Post)("items"),
    (0, swagger_1.ApiOperation)({ summary: "Create a service catalog item" }),
    (0, permissions_decorator_1.RequirePermissions)("service_catalog:write"),
    (0, audited_decorator_1.Audited)({
        action: "service_catalog_item.create",
        resource: "serviceCatalogItem",
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, service_catalog_dto_1.CreateServiceItemDto]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "createItem", null);
__decorate([
    (0, common_1.Get)("items"),
    (0, swagger_1.ApiOperation)({ summary: "List all service catalog items" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)("category")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "findAllItems", null);
__decorate([
    (0, common_1.Get)("items/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get service catalog item details" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "findOneItem", null);
__decorate([
    (0, common_1.Post)("requests"),
    (0, swagger_1.ApiOperation)({ summary: "Submit a service request" }),
    (0, permissions_decorator_1.RequirePermissions)("service_catalog:write"),
    (0, audited_decorator_1.Audited)({
        action: "service_request.create",
        resource: "serviceRequest",
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, service_catalog_dto_1.CreateServiceRequestDto]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "createRequest", null);
__decorate([
    (0, common_1.Get)("requests"),
    (0, swagger_1.ApiOperation)({ summary: "List all service requests" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "findAllRequests", null);
__decorate([
    (0, common_1.Get)("requests/:id"),
    (0, swagger_1.ApiOperation)({ summary: "Get service request details" }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "findOneRequest", null);
__decorate([
    (0, common_1.Post)("requests/:id/approve"),
    (0, swagger_1.ApiOperation)({ summary: "Approve a service request" }),
    (0, permissions_decorator_1.RequirePermissions)("service_catalog:update"),
    (0, audited_decorator_1.Audited)({
        action: "service_request.approve",
        resource: "serviceRequest",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, service_catalog_dto_1.ApproveServiceRequestDto]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "approveRequest", null);
__decorate([
    (0, common_1.Post)("requests/:id/reject"),
    (0, swagger_1.ApiOperation)({ summary: "Reject a service request" }),
    (0, permissions_decorator_1.RequirePermissions)("service_catalog:update"),
    (0, audited_decorator_1.Audited)({
        action: "service_request.reject",
        resource: "serviceRequest",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, service_catalog_dto_1.RejectServiceRequestDto]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "rejectRequest", null);
__decorate([
    (0, common_1.Post)("requests/:id/fulfill"),
    (0, swagger_1.ApiOperation)({ summary: "Mark service request as fulfilled" }),
    (0, permissions_decorator_1.RequirePermissions)("service_catalog:update"),
    (0, audited_decorator_1.Audited)({
        action: "service_request.fulfill",
        resource: "serviceRequest",
        capturePreviousValue: true,
        captureNewValue: true,
    }),
    __param(0, (0, common_1.Request)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, service_catalog_dto_1.FulfillServiceRequestDto]),
    __metadata("design:returntype", void 0)
], ServiceCatalogController.prototype, "fulfillRequest", null);
exports.ServiceCatalogController = ServiceCatalogController = __decorate([
    (0, swagger_1.ApiTags)("service-catalog"),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.RequirePermissions)("service_catalog:read"),
    (0, common_1.Controller)("service-catalog"),
    __metadata("design:paramtypes", [service_catalog_service_1.ServiceCatalogService])
], ServiceCatalogController);
//# sourceMappingURL=service-catalog.controller.js.map