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
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
let CacheService = CacheService_1 = class CacheService {
    configService;
    logger = new common_1.Logger(CacheService_1.name);
    client = null;
    isConnected = false;
    defaultTTL;
    constructor(configService) {
        this.configService = configService;
        this.defaultTTL = this.configService.get("CACHE_TTL", 3600);
    }
    async onModuleInit() {
        const redisHost = this.configService.get("REDIS_HOST", "localhost");
        const redisPort = this.configService.get("REDIS_PORT", 6379);
        const redisUrl = this.configService.get("REDIS_URL", `redis://${redisHost}:${redisPort}`);
        try {
            this.client = (0, redis_1.createClient)({
                url: redisUrl,
                socket: {
                    reconnectStrategy: (retries) => {
                        if (retries > 10) {
                            this.logger.error("Redis connection failed after 10 retries");
                            return new Error("Redis connection failed");
                        }
                        const delay = Math.min(retries * 100, 3000);
                        this.logger.warn(`Redis reconnecting in ${delay}ms (attempt ${retries})`);
                        return delay;
                    },
                },
            });
            this.client.on("connect", () => {
                this.isConnected = true;
                this.logger.log("Redis cache connected");
            });
            this.client.on("disconnect", () => {
                this.isConnected = false;
                this.logger.warn("Redis cache disconnected");
            });
            this.client.on("error", (err) => {
                this.logger.error(`Redis error: ${err.message}`);
            });
            await this.client.connect();
        }
        catch (error) {
            this.logger.error(`Failed to connect to Redis: ${error.message}`);
            this.isConnected = false;
        }
    }
    async onModuleDestroy() {
        if (this.client) {
            await this.client.quit();
            this.logger.log("Redis cache disconnected");
        }
    }
    buildKey(key, options) {
        const prefix = options?.prefix || "nexusops";
        return `${prefix}:${key}`;
    }
    async get(key, options) {
        if (!this.isConnected || !this.client) {
            return null;
        }
        try {
            const fullKey = this.buildKey(key, options);
            const value = await this.client.get(fullKey);
            if (!value || typeof value !== "string") {
                return null;
            }
            return JSON.parse(value);
        }
        catch (error) {
            this.logger.error(`Cache get error for key ${key}: ${error?.message || "Unknown error"}`);
            return null;
        }
    }
    async set(key, value, options) {
        if (!this.isConnected || !this.client) {
            return false;
        }
        try {
            const fullKey = this.buildKey(key, options);
            const ttl = options?.ttl ?? this.defaultTTL;
            const serialized = JSON.stringify(value);
            await this.client.setEx(fullKey, ttl, serialized);
            return true;
        }
        catch (error) {
            this.logger.error(`Cache set error for key ${key}: ${error.message}`);
            return false;
        }
    }
    async getOrSet(key, factory, options) {
        const cached = await this.get(key, options);
        if (cached !== null) {
            return cached;
        }
        const value = await factory();
        await this.set(key, value, options);
        return value;
    }
    async delete(key, options) {
        if (!this.isConnected || !this.client) {
            return false;
        }
        try {
            const fullKey = this.buildKey(key, options);
            await this.client.del(fullKey);
            return true;
        }
        catch (error) {
            this.logger.error(`Cache delete error for key ${key}: ${error.message}`);
            return false;
        }
    }
    async deletePattern(pattern, options) {
        if (!this.isConnected || !this.client) {
            return 0;
        }
        try {
            const prefix = options?.prefix || "nexusops";
            const fullPattern = `${prefix}:${pattern}`;
            let deletedCount = 0;
            for await (const key of this.client.scanIterator({
                MATCH: fullPattern,
                COUNT: 100,
            })) {
                await this.client.del(key);
                deletedCount++;
            }
            this.logger.log(`Deleted ${deletedCount} keys matching pattern ${fullPattern}`);
            return deletedCount;
        }
        catch (error) {
            this.logger.error(`Cache deletePattern error for pattern ${pattern}: ${error.message}`);
            return 0;
        }
    }
    async invalidateOrganization(organizationId) {
        await this.deletePattern(`org:${organizationId}:*`);
    }
    async invalidateUser(userId) {
        await this.deletePattern(`user:${userId}:*`);
    }
    async invalidateEntity(entityType, entityId) {
        await this.delete(`${entityType}:${entityId}`);
        await this.deletePattern(`${entityType}:list:*`);
    }
    async getStats() {
        if (!this.isConnected || !this.client) {
            return { connected: false, keys: 0, memory: null };
        }
        try {
            const dbSize = await this.client.dbSize();
            const info = await this.client.info("memory");
            const memoryMatch = info.match(/used_memory_human:(\S+)/);
            const memory = memoryMatch ? memoryMatch[1] : null;
            return {
                connected: true,
                keys: dbSize,
                memory,
            };
        }
        catch (error) {
            this.logger.error(`Cache getStats error: ${error.message}`);
            return { connected: false, keys: 0, memory: null };
        }
    }
    async healthCheck() {
        if (!this.client) {
            return false;
        }
        try {
            const result = await this.client.ping();
            return result === "PONG";
        }
        catch {
            return false;
        }
    }
    async reset() {
        if (!this.isConnected || !this.client) {
            return;
        }
        try {
            await this.client.flushDb();
            this.logger.warn("Cache flushed");
        }
        catch (error) {
            this.logger.error(`Cache reset error: ${error.message}`);
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], CacheService);
//# sourceMappingURL=cache.service.js.map