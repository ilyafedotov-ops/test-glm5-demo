import { Body, Controller, Get, Put, Query, Request, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { SLADashboardService } from "./sla-dashboard.service";
import { UpdateSLATargetsDto } from "./dto/sla-targets.dto";

@ApiTags("dashboard-sla")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("sla:read")
@Controller("dashboard/sla")
export class SLADashboardController {
  constructor(private readonly slaDashboardService: SLADashboardService) {}

  @Get("metrics")
  @ApiOperation({ summary: "Get SLA metrics and compliance data" })
  getMetrics(
    @Request() req: any,
    @Query("period") period?: string
  ) {
    return this.slaDashboardService.getSLAMetrics(
      req.user.organizationId,
      period || "7d"
    );
  }

  @Get("breached")
  @ApiOperation({ summary: "Get all breached SLAs" })
  getBreached(@Request() req: any) {
    return this.slaDashboardService.getBreachedSLAs(req.user.organizationId);
  }

  @Get("at-risk")
  @ApiOperation({ summary: "Get all at-risk SLAs" })
  getAtRisk(@Request() req: any) {
    return this.slaDashboardService.getAtRiskSLAs(req.user.organizationId);
  }

  @Get("targets")
  @ApiOperation({ summary: "Get SLA target policies by priority" })
  getTargets(@Request() req: any) {
    return this.slaDashboardService.getSLATargets(req.user.organizationId);
  }

  @Put("targets")
  @RequirePermissions("admin:all")
  @ApiOperation({ summary: "Update SLA target policies by priority" })
  updateTargets(@Request() req: any, @Body() dto: UpdateSLATargetsDto) {
    return this.slaDashboardService.updateSLATargets(req.user.organizationId, dto.targets);
  }
}
