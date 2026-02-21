import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createClient, RedisClientType } from "redis";

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  prefix?: string; // Key prefix for namespacing
}

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private client: RedisClientType | null = null;
  private isConnected = false;
  private defaultTTL: number;

  constructor(private configService: ConfigService) {
    this.defaultTTL = this.configService.get("CACHE_TTL", 3600); // Default 1 hour
  }

  async onModuleInit() {
    const redisHost = this.configService.get("REDIS_HOST", "localhost");
    const redisPort = this.configService.get("REDIS_PORT", 6379);
    const redisUrl = this.configService.get("REDIS_URL", `redis://${redisHost}:${redisPort}`);

    try {
      this.client = createClient({
        url: redisUrl,
        socket: {
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              this.logger.error("Redis connection failed after 10 retries");
              return new Error("Redis connection failed");
            }
            // Exponential backoff
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
    } catch (error) {
      this.logger.error(`Failed to connect to Redis: ${error.message}`);
      // Continue without cache if Redis is unavailable
      this.isConnected = false;
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit();
      this.logger.log("Redis cache disconnected");
    }
  }

  private buildKey(key: string, options?: CacheOptions): string {
    const prefix = options?.prefix || "nexusops";
    return `${prefix}:${key}`;
  }

  // Get value from cache
  async get<T>(key: string, options?: CacheOptions): Promise<T | null> {
    if (!this.isConnected || !this.client) {
      return null;
    }

    try {
      const fullKey = this.buildKey(key, options);
      const value = await this.client.get(fullKey);

      if (!value || typeof value !== "string") {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error: any) {
      this.logger.error(`Cache get error for key ${key}: ${error?.message || "Unknown error"}`);
      return null;
    }
  }

  // Set value in cache
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options);
      const ttl = options?.ttl ?? this.defaultTTL;
      const serialized = JSON.stringify(value);

      await this.client.setEx(fullKey, ttl, serialized);
      return true;
    } catch (error) {
      this.logger.error(`Cache set error for key ${key}: ${error.message}`);
      return false;
    }
  }

  // Get or set (cache-aside pattern)
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    options?: CacheOptions
  ): Promise<T> {
    const cached = await this.get<T>(key, options);
    if (cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, options);
    return value;
  }

  // Delete value from cache
  async delete(key: string, options?: CacheOptions): Promise<boolean> {
    if (!this.isConnected || !this.client) {
      return false;
    }

    try {
      const fullKey = this.buildKey(key, options);
      await this.client.del(fullKey);
      return true;
    } catch (error) {
      this.logger.error(`Cache delete error for key ${key}: ${error.message}`);
      return false;
    }
  }

  // Delete multiple keys matching pattern
  async deletePattern(pattern: string, options?: CacheOptions): Promise<number> {
    if (!this.isConnected || !this.client) {
      return 0;
    }

    try {
      const prefix = options?.prefix || "nexusops";
      const fullPattern = `${prefix}:${pattern}`;
      let deletedCount = 0;

      // Scan for keys matching pattern
      for await (const key of this.client.scanIterator({
        MATCH: fullPattern,
        COUNT: 100,
      })) {
        await this.client.del(key);
        deletedCount++;
      }

      this.logger.log(`Deleted ${deletedCount} keys matching pattern ${fullPattern}`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`Cache deletePattern error for pattern ${pattern}: ${error.message}`);
      return 0;
    }
  }

  // Invalidate cache for organization (multi-tenant)
  async invalidateOrganization(organizationId: string): Promise<void> {
    await this.deletePattern(`org:${organizationId}:*`);
  }

  // Invalidate cache for user
  async invalidateUser(userId: string): Promise<void> {
    await this.deletePattern(`user:${userId}:*`);
  }

  // Invalidate cache for entity
  async invalidateEntity(entityType: string, entityId: string): Promise<void> {
    await this.delete(`${entityType}:${entityId}`);
    await this.deletePattern(`${entityType}:list:*`);
  }

  // Get cache statistics
  async getStats(): Promise<{
    connected: boolean;
    keys: number;
    memory: string | null;
  }> {
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
    } catch (error) {
      this.logger.error(`Cache getStats error: ${error.message}`);
      return { connected: false, keys: 0, memory: null };
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    if (!this.client) {
      return false;
    }

    try {
      const result = await this.client.ping();
      return result === "PONG";
    } catch {
      return false;
    }
  }

  // Reset cache (use with caution!)
  async reset(): Promise<void> {
    if (!this.isConnected || !this.client) {
      return;
    }

    try {
      await this.client.flushDb();
      this.logger.warn("Cache flushed");
    } catch (error) {
      this.logger.error(`Cache reset error: ${error.message}`);
    }
  }
}
