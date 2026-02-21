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
exports.HealthController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const monitoring_service_1 = require("./monitoring.service");
let HealthController = class HealthController {
    monitoringService;
    constructor(monitoringService) {
        this.monitoringService = monitoringService;
    }
    async getHealth() {
        const health = await this.monitoringService.getHealth();
        return health;
    }
    async getLiveness() {
        return this.monitoringService.getLiveness();
    }
    async getReadiness() {
        const readiness = await this.monitoringService.getReadiness();
        return readiness;
    }
};
exports.HealthController = HealthController;
__decorate([
    (0, common_1.Get)("health"),
    (0, swagger_1.ApiOperation)({ summary: "Full health check", description: "Returns comprehensive health status of all services" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Service is healthy" }),
    (0, swagger_1.ApiResponse)({ status: 503, description: "Service is unhealthy" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getHealth", null);
__decorate([
    (0, common_1.Get)("health/live"),
    (0, swagger_1.ApiOperation)({ summary: "Liveness probe", description: "Kubernetes liveness probe endpoint" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Service is alive" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getLiveness", null);
__decorate([
    (0, common_1.Get)("health/ready"),
    (0, swagger_1.ApiOperation)({ summary: "Readiness probe", description: "Kubernetes readiness probe endpoint" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Service is ready" }),
    (0, swagger_1.ApiResponse)({ status: 503, description: "Service is not ready" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], HealthController.prototype, "getReadiness", null);
exports.HealthController = HealthController = __decorate([
    (0, swagger_1.ApiTags)("Health"),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [monitoring_service_1.MonitoringService])
], HealthController);
//# sourceMappingURL=health.controller.js.map