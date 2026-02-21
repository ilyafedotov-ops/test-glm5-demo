import { Injectable, Logger, OnModuleDestroy, OnModuleInit, Optional } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { readFile } from "node:fs/promises";
import * as os from "node:os";
import Redis from "ioredis";
import { PrismaService } from "@/prisma/prisma.service";

export interface HealthCheckResult {
  status: "healthy" | "unhealthy" | "degraded";
  timestamp: string;
  uptime: number;
  version: string;
  checks: Record<string, { status: string; latency?: number; message?: string }>;
}

export interface MetricData {
  name: string;
  value: number;
  tags?: Record<string, string>;
  timestamp?: Date;
}

@Injectable()
export class MonitoringService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MonitoringService.name);
  private startTime: Date;
  private metricsBuffer: MetricData[] = [];
  private flushInterval?: NodeJS.Timeout;
  private redisClient?: Redis;
  private memoryLimitBytes?: number;

  // Simple in-memory metrics storage
  private counters: Map<string, number> = new Map();
  private gauges: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();

  constructor(
    private readonly configService: ConfigService,
    @Optional() private readonly prisma?: PrismaService,
  ) {
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

    const redisUrl = this.configService.get<string>("REDIS_URL");
    if (redisUrl) {
      this.redisClient = new Redis(redisUrl, {
        lazyConnect: true,
        maxRetriesPerRequest: 1,
        enableReadyCheck: false,
      });
    }

    // Setup periodic metrics flush
    this.flushInterval = setInterval(() => {
      this.flushMetrics();
    }, 60000); // Flush every minute
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

  // ============================================
  // Health Checks
  // ============================================

  async getHealth(): Promise<HealthCheckResult> {
    const checks: Record<string, { status: string; latency?: number; message?: string }> = {};

    // Database check
    checks["database"] = await this.checkDatabaseHealth();

    // Redis check
    checks["redis"] = await this.checkRedisHealth();

    // Memory check
    const memUsage = process.memoryUsage();
    const memoryLimitBytes = await this.getMemoryLimitBytes();
    const rssUsedPercent = (memUsage.rss / memoryLimitBytes) * 100;
    checks["memory"] = {
      status: rssUsedPercent > 90 ? "unhealthy" : rssUsedPercent > 75 ? "degraded" : "healthy",
      message: `RSS usage: ${rssUsedPercent.toFixed(1)}% (${this.toMiB(memUsage.rss)}MiB/${this.toMiB(memoryLimitBytes)}MiB)`,
    };

    // Determine overall status
    const statuses = Object.values(checks).map((c) => c.status);
    let overallStatus: "healthy" | "unhealthy" | "degraded" = "healthy";
    if (statuses.includes("unhealthy")) {
      overallStatus = "unhealthy";
    } else if (statuses.includes("degraded")) {
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

  async getLiveness(): Promise<{ status: string }> {
    return { status: "ok" };
  }

  async getReadiness(): Promise<{ status: string; checks: Record<string, boolean> }> {
    const dbHealth = await this.checkDatabaseHealth();
    const redisHealth = await this.checkRedisHealth();

    const checks: Record<string, boolean> = {
      database: dbHealth.status === "healthy",
      redis: redisHealth.status !== "unhealthy",
    };

    const allHealthy = Object.values(checks).every((v) => v);

    return {
      status: allHealthy ? "ok" : "not_ready",
      checks,
    };
  }

  // ============================================
  // Metrics Collection
  // ============================================

  incrementCounter(name: string, value = 1, tags?: Record<string, string>) {
    const key = this.getMetricKey(name, tags);
    const current = this.counters.get(key) || 0;
    this.counters.set(key, current + value);

    this.bufferMetric({ name, value: current + value, tags });
  }

  setGauge(name: string, value: number, tags?: Record<string, string>) {
    const key = this.getMetricKey(name, tags);
    this.gauges.set(key, value);

    this.bufferMetric({ name, value, tags });
  }

  recordHistogram(name: string, value: number, tags?: Record<string, string>) {
    const key = this.getMetricKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    this.bufferMetric({ name, value, tags });
  }

  timing(name: string, durationMs: number, tags?: Record<string, string>) {
    this.recordHistogram(`${name}.duration_ms`, durationMs, tags);
  }

  // ============================================
  // Performance Timing Helper
  // ============================================

  startTimer(name: string, tags?: Record<string, string>): () => void {
    const start = Date.now();
    return () => {
      const duration = Date.now() - start;
      this.timing(name, duration, tags);
    };
  }

  // ============================================
  // Metrics Retrieval
  // ============================================

  getCounters(): Map<string, number> {
    return new Map(this.counters);
  }

  getGauges(): Map<string, number> {
    return new Map(this.gauges);
  }

  getHistograms(): Map<string, number[]> {
    return new Map(this.histograms);
  }

  getHistogramStats(name: string, tags?: Record<string, string>): {
    count: number;
    min: number;
    max: number;
    mean: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.getMetricKey(name, tags);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) return null;

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

  // ============================================
  // Private Methods
  // ============================================

  private getMetricKey(name: string, tags?: Record<string, string>): string {
    if (!tags) return name;
    const tagStr = Object.entries(tags)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join(",");
    return `${name}{${tagStr}}`;
  }

  private bufferMetric(metric: MetricData) {
    this.metricsBuffer.push({
      ...metric,
      timestamp: new Date(),
    });
  }

  private flushMetrics() {
    if (this.metricsBuffer.length === 0) return;

    // In production, this would send to:
    // - OpenTelemetry Collector
    // - Prometheus Push Gateway
    // - Datadog/StatsD
    // - Custom metrics backend

    this.logger.debug(`Flushing ${this.metricsBuffer.length} metrics`);
    this.metricsBuffer = [];
  }

  private async checkDatabaseHealth(): Promise<{ status: string; latency?: number; message?: string }> {
    if (!this.prisma) {
      return {
        status: "degraded",
        message: "Prisma service unavailable",
      };
    }

    const start = Date.now();
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return {
        status: "healthy",
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown database error",
      };
    }
  }

  private async checkRedisHealth(): Promise<{ status: string; latency?: number; message?: string }> {
    if (!this.redisClient) {
      return {
        status: "healthy",
        message: "Redis not configured",
      };
    }

    const start = Date.now();
    try {
      const status = this.redisClient.status;
      if (status === "connecting" || status === "connect" || status === "reconnecting") {
        const becameReady = await this.waitForRedisReady();
        if (!becameReady) {
          return {
            status: "degraded",
            message: `Redis still ${this.redisClient.status}`,
          };
        }
      } else if (status !== "ready") {
        await this.redisClient.connect();
      }

      await this.redisClient.ping();
      return {
        status: "healthy",
        latency: Date.now() - start,
      };
    } catch (error) {
      return {
        status: "unhealthy",
        message: error instanceof Error ? error.message : "Unknown redis error",
      };
    }
  }

  private async waitForRedisReady(timeoutMs = 1500): Promise<boolean> {
    if (!this.redisClient) {
      return false;
    }

    if (this.redisClient.status === "ready") {
      return true;
    }

    return new Promise((resolve) => {
      const client = this.redisClient!;
      let settled = false;

      const cleanup = () => {
        client.off("ready", onReady);
        client.off("error", onError);
      };

      const finish = (result: boolean) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        cleanup();
        resolve(result);
      };

      const onReady = () => finish(true);
      const onError = () => finish(false);
      const timeout = setTimeout(() => finish(client.status === "ready"), timeoutMs);

      client.once("ready", onReady);
      client.once("error", onError);
    });
  }

  private async getMemoryLimitBytes(): Promise<number> {
    if (this.memoryLimitBytes && this.memoryLimitBytes > 0) {
      return this.memoryLimitBytes;
    }

    const configuredLimit = this.configService.get<string>("MEMORY_LIMIT_BYTES");
    const parsedConfigured = Number(configuredLimit);
    if (configuredLimit && Number.isFinite(parsedConfigured) && parsedConfigured > 0) {
      this.memoryLimitBytes = parsedConfigured;
      return this.memoryLimitBytes;
    }

    const cgroupPaths = ["/sys/fs/cgroup/memory.max", "/sys/fs/cgroup/memory/memory.limit_in_bytes"];
    for (const path of cgroupPaths) {
      try {
        const raw = (await readFile(path, "utf8")).trim();
        if (raw === "max") {
          break;
        }

        const parsed = Number(raw);
        if (!Number.isFinite(parsed) || parsed <= 0) {
          continue;
        }

        // Ignore unrealistic values that indicate "no limit" in some cgroup setups.
        if (parsed > Number.MAX_SAFE_INTEGER / 4 || parsed > os.totalmem() * 8) {
          continue;
        }

        this.memoryLimitBytes = parsed;
        return this.memoryLimitBytes;
      } catch {
        // Path may not exist outside Linux containers.
      }
    }

    this.memoryLimitBytes = os.totalmem();
    return this.memoryLimitBytes;
  }

  private toMiB(bytes: number): string {
    return (bytes / 1024 / 1024).toFixed(1);
  }
}
