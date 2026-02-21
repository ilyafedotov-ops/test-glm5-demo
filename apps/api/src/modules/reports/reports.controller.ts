import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  UseGuards,
  Request,
  Query,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { Audited } from "../audit/decorators/audited.decorator";
import { ReportsService } from "./reports.service";
import { RunReportDto } from "./dto/run-report.dto";

@ApiTags("reports")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("reports:read")
@Controller("reports")
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: "Get available report types" })
  async getAvailableReports() {
    return this.reportsService.getAvailableReports();
  }

  @Get("jobs")
  @ApiOperation({ summary: "Get report job history" })
  async getReportJobs(
    @Request() req: { user: { organizationId: string } },
    @Query("page") page?: string,
    @Query("limit") limit?: string,
    @Query("status") status?: string,
    @Query("type") type?: string,
    @Query("format") format?: string
  ) {
    return this.reportsService.getReportJobs(
      req.user.organizationId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      { status, type, format }
    );
  }

  @Post("run")
  @ApiOperation({ summary: "Run a report" })
  @RequirePermissions("reports:write")
  @Audited({ action: "report.run", resource: "reportJob", captureNewValue: true })
  async runReport(
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() dto: RunReportDto
  ) {
    return this.reportsService.runReport(
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Get("jobs/:id")
  @ApiOperation({ summary: "Get report job status" })
  async getReportJob(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.reportsService.getReportJob(id, req.user.organizationId);
  }
}
