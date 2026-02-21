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
exports.MetricsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const metrics_service_1 = require("./metrics.service");
let MetricsController = class MetricsController {
    metricsService;
    constructor(metricsService) {
        this.metricsService = metricsService;
    }
    async getMetrics() {
        return this.metricsService.getPrometheusMetrics();
    }
    async getJsonMetrics() {
        return this.metricsService.getJsonMetrics();
    }
    async getSystemMetrics() {
        const memUsage = process.memoryUsage();
        const uptime = process.uptime();
        return {
            cpu: {
                usage: process.cpuUsage().user / 1000,
            },
            memory: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                rss: memUsage.rss,
                external: memUsage.external,
            },
            uptime,
            nodeVersion: process.version,
            platform: process.platform,
        };
    }
};
exports.MetricsController = MetricsController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: "Get Prometheus metrics", description: "Returns metrics in Prometheus exposition format" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Metrics in Prometheus format", content: { "text/plain": {} } }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getMetrics", null);
__decorate([
    (0, common_1.Get)("json"),
    (0, swagger_1.ApiOperation)({ summary: "Get JSON metrics", description: "Returns metrics in JSON format" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "Metrics in JSON format" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getJsonMetrics", null);
__decorate([
    (0, common_1.Get)("system"),
    (0, swagger_1.ApiOperation)({ summary: "Get system metrics", description: "Returns system-level metrics (CPU, memory, etc.)" }),
    (0, swagger_1.ApiResponse)({ status: 200, description: "System metrics" }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MetricsController.prototype, "getSystemMetrics", null);
exports.MetricsController = MetricsController = __decorate([
    (0, swagger_1.ApiTags)("Metrics"),
    (0, common_1.Controller)("metrics"),
    __metadata("design:paramtypes", [metrics_service_1.MetricsService])
], MetricsController);
//# sourceMappingURL=metrics.controller.js.map