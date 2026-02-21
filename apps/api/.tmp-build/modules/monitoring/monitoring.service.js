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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var MonitoringService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.MonitoringService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const ioredis_1 = __importDefault(require("ioredis"));
const prisma_service_1 = require("@/prisma/prisma.service");
let MonitoringService = MonitoringService_1 = class MonitoringService {
    configService;
    prisma;
    logger = new common_1.Logger(MonitoringService_1.name);
    startTime;
    metricsBuffer = [];
    flushInterval;
    redisClient;
    counters = new Map();
    gauges = new Map();
    histograms = new Map();
    constructor(configService, prisma) {
        this.configService = configService;
        this.prisma = prisma;
        this.startTime = new Date();
    }
    onModuleInit() {
        this.initialize();
    }
    onModuleDestroy() {
        this.shutdown();
    }
    initialize() {
        this.logger.log("Initializing monitoring service...");
        const redisUrl = this.configService.get("REDIS_URL");
        if (redisUrl) {
            this.redisClient = new ioredis_1.default(redisUrl, {
                lazyConnect: true,
                maxRetriesPerRequest: 1,
                enableReadyCheck: false,
            });
        }
        this.flushInterval = setInterval(() => {
            this.flushMetrics();
        }, 60000);
    }
    shutdown() {
        if (this.flushInterval) {
            clearInterval(this.flushInterval);
        }
        if (this.redisClient) {
            this.redisClient.disconnect();
        }
        this.flushMetrics();
        this.logger.log("Monitoring service shutdown complete");
    }
    async getHealth() {
        const checks = {};
        checks["database"] = await this.checkDatabaseHealth();
        checks["redis"] = await this.checkRedisHealth();
        const memUsage = process.memoryUsage();
        const heapUsedPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
        checks["memory"] = {
            status: heapUsedPercent > 90 ? "unhealthy" : heapUsedPercent > 75 ? "degraded" : "healthy",
            message: `Heap usage: ${heapUsedPercent.toFixed(1)}%`,
        };
        const statuses = Object.values(checks).map((c) => c.status);
        let overallStatus = "healthy";
        if (statuses.includes("unhealthy")) {
            overallStatus = "unhealthy";
        }
        else if (statuses.includes("degraded")) {
            overallStatus = "degraded";
        }
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            uptime: Math.floor((Date.now() - this.startTime.getTime()) / 1000),
            version: this.configService.get("npm_package_version", "1.0.0"),
            checks,
        };
    }
    async getLiveness() {
        return { status: "ok" };
    }
    async getReadiness() {
        const dbHealth = await this.checkDatabaseHealth();
        const redisHealth = await this.checkRedisHealth();
        const checks = {
            database: dbHealth.status === "healthy",
            redis: redisHealth.status !== "unhealthy",
        };
        const allHealthy = Object.values(checks).every((v) => v);
        return {
            status: allHealthy ? "ok" : "not_ready",
            checks,
        };
    }
    incrementCounter(name, value = 1, tags) {
        const key = this.getMetricKey(name, tags);
        const current = this.counters.get(key) || 0;
        this.counters.set(key, current + value);
        this.bufferMetric({ name, value: current + value, tags });
    }
    setGauge(name, value, tags) {
        const key = this.getMetricKey(name, tags);
        this.gauges.set(key, value);
        this.bufferMetric({ name, value, tags });
    }
    recordHistogram(name, value, tags) {
        const key = this.getMetricKey(name, tags);
        const values = this.histograms.get(key) || [];
        values.push(value);
        this.histograms.set(key, values);
        this.bufferMetric({ name, value, tags });
    }
    timing(name, durationMs, tags) {
        this.recordHistogram(`${name}.duration_ms`, durationMs, tags);
    }
    startTimer(name, tags) {
        const start = Date.now();
        return () => {
            const duration = Date.now() - start;
            this.timing(name, duration, tags);
        };
    }
    getCounters() {
        return new Map(this.counters);
    }
    getGauges() {
        return new Map(this.gauges);
    }
    getHistograms() {
        return new Map(this.histograms);
    }
    getHistogramStats(name, tags) {
        const key = this.getMetricKey(name, tags);
        const values = this.histograms.get(key);
        if (!values || values.length === 0)
            return null;
        const sorted = [...values].sort((a, b) => a - b);
        const count = sorted.length;
        const p50Val = sorted[Math.floor(count * 0.5)];
        const p95Val = sorted[Math.floor(count * 0.95)];
        const p99Val = sorted[Math.floor(count * 0.99)];
        return {
            count,
            min: sorted[0] ?? 0,
            max: sorted[count - 1] ?? 0,
            mean: sorted.reduce((a, b) => a + b, 0) / count,
            p50: p50Val ?? 0,
            p95: p95Val ?? 0,
            p99: p99Val ?? 0,
        };
    }
    getMetricKey(name, tags) {
        if (!tags)
            return name;
        const tagStr = Object.entries(tags)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([k, v]) => `${k}=${v}`)
            .join(",");
        return `${name}{${tagStr}}`;
    }
    bufferMetric(metric) {
        this.metricsBuffer.push({
            ...metric,
            timestamp: new Date(),
        });
    }
    flushMetrics() {
        if (this.metricsBuffer.length === 0)
            return;
        this.logger.debug(`Flushing ${this.metricsBuffer.length} metrics`);
        this.metricsBuffer = [];
    }
    async checkDatabaseHealth() {
        if (!this.prisma) {
            return {
                status: "degraded",
                message: "Prisma service unavailable",
            };
        }
        const start = Date.now();
        try {
            await this.prisma.$queryRaw `SELECT 1`;
            return {
                status: "healthy",
                latency: Date.now() - start,
            };
        }
        catch (error) {
            return {
                status: "unhealthy",
                message: error instanceof Error ? error.message : "Unknown database error",
            };
        }
    }
    async checkRedisHealth() {
        if (!this.redisClient) {
            return {
                status: "healthy",
                message: "Redis not configured",
            };
        }
        const start = Date.now();
        try {
            if (this.redisClient.status !== "ready") {
                await this.redisClient.connect();
            }
            await this.redisClient.ping();
            return {
                status: "healthy",
                latency: Date.now() - start,
            };
        }
        catch (error) {
            return {
                status: "unhealthy",
                message: error instanceof Error ? error.message : "Unknown redis error",
            };
        }
    }
};
exports.MonitoringService = MonitoringService;
exports.MonitoringService = MonitoringService = MonitoringService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Optional)()),
    __metadata("design:paramtypes", [config_1.ConfigService,
        prisma_service_1.PrismaService])
], MonitoringService);
//# sourceMappingURL=monitoring.service.js.map