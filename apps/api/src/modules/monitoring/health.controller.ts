import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { MonitoringService, HealthCheckResult } from "./monitoring.service";

@ApiTags("Health")
@Controller()
export class HealthController {
  constructor(private readonly monitoringService: MonitoringService) {}

  @Get("health")
  @ApiOperation({ summary: "Full health check", description: "Returns comprehensive health status of all services" })
  @ApiResponse({ status: 200, description: "Service is healthy" })
  @ApiResponse({ status: 503, description: "Service is unhealthy" })
  async getHealth(): Promise<HealthCheckResult> {
    const health = await this.monitoringService.getHealth();
    return health;
  }

  @Get("health/live")
  @ApiOperation({ summary: "Liveness probe", description: "Kubernetes liveness probe endpoint" })
  @ApiResponse({ status: 200, description: "Service is alive" })
  async getLiveness(): Promise<{ status: string }> {
    return this.monitoringService.getLiveness();
  }

  @Get("health/ready")
  @ApiOperation({ summary: "Readiness probe", description: "Kubernetes readiness probe endpoint" })
  @ApiResponse({ status: 200, description: "Service is ready" })
  @ApiResponse({ status: 503, description: "Service is not ready" })
  async getReadiness(): Promise<{ status: string; checks: Record<string, boolean> }> {
    const readiness = await this.monitoringService.getReadiness();
    return readiness;
  }
}
