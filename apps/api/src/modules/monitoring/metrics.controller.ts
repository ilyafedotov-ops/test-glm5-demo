import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { MetricsService, MetricsResponse } from "./metrics.service";

@ApiTags("Metrics")
@Controller("metrics")
export class MetricsController {
  constructor(private readonly metricsService: MetricsService) {}

  @Get()
  @ApiOperation({ summary: "Get Prometheus metrics", description: "Returns metrics in Prometheus exposition format" })
  @ApiResponse({ status: 200, description: "Metrics in Prometheus format", content: { "text/plain": {} } })
  async getMetrics(): Promise<string> {
    return this.metricsService.getPrometheusMetrics();
  }

  @Get("json")
  @ApiOperation({ summary: "Get JSON metrics", description: "Returns metrics in JSON format" })
  @ApiResponse({ status: 200, description: "Metrics in JSON format" })
  async getJsonMetrics(): Promise<MetricsResponse> {
    return this.metricsService.getJsonMetrics();
  }

  @Get("system")
  @ApiOperation({ summary: "Get system metrics", description: "Returns system-level metrics (CPU, memory, etc.)" })
  @ApiResponse({ status: 200, description: "System metrics" })
  async getSystemMetrics(): Promise<{
    cpu: { usage: number };
    memory: { heapUsed: number; heapTotal: number; rss: number; external: number };
    uptime: number;
    nodeVersion: string;
    platform: string;
  }> {
    const memUsage = process.memoryUsage();
    const uptime = process.uptime();

    return {
      cpu: {
        usage: process.cpuUsage().user / 1000, // Convert to ms
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
}
