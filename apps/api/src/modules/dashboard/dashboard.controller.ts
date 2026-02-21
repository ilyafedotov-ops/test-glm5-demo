import { Controller, Get, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { DashboardService } from "./dashboard.service";

@ApiTags("dashboard")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("dashboard:read")
@Controller("dashboard")
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get("summary")
  @ApiOperation({ summary: "Get dashboard summary metrics" })
  async getSummary(@Request() req: { user: { organizationId: string } }) {
    return this.dashboardService.getSummary(req.user.organizationId);
  }

  @Get("correlation-map")
  @ApiOperation({ summary: "Get cross-domain correlation map for workflows/tasks/compliance/audit" })
  async getCorrelationMap(@Request() req: { user: { organizationId: string } }) {
    return this.dashboardService.getCorrelationMap(req.user.organizationId);
  }

  @Get("risk-summary")
  @ApiOperation({ summary: "Get dashboard major-incident strip and service risk scoring summary" })
  async getRiskSummary(@Request() req: { user: { organizationId: string } }) {
    return this.dashboardService.getRiskSummary(req.user.organizationId);
  }
}
