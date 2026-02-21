import {
  Controller,
  Get,
  Query,
  Param,
  UseGuards,
  Request,
  Header,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { AuditService } from "./audit.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { AuditQueryDto } from "./dto/audit-query.dto";
import { AuditLogEntity, AuditLogDetail } from "./entities/audit-log.entity";

@ApiTags("audit-logs")
@Controller("audit-logs")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin:all")
@ApiBearerAuth()
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: "List all audit logs" })
  @ApiResponse({ status: 200, description: "List of audit logs" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @Request() req: { user: { organizationId: string } },
    @Query() query: AuditQueryDto
  ) {
    return this.auditService.findAll(req.user.organizationId, query);
  }

  @Get("stats")
  @ApiOperation({ summary: "Get audit log statistics" })
  @ApiResponse({ status: 200, description: "Audit log statistics" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getStats(
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.auditService.getStats(req.user.organizationId);
  }

  @Get("export")
  @ApiOperation({ summary: "Export audit logs as JSON" })
  @ApiResponse({ status: 200, description: "Audit logs exported" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @Header("Content-Type", "application/json")
  @Header("Content-Disposition", "attachment; filename=audit-logs.json")
  async export(
    @Request() req: { user: { organizationId: string } },
    @Query() query: AuditQueryDto
  ): Promise<AuditLogEntity[]> {
    return this.auditService.exportLogs(req.user.organizationId, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get audit log by ID with diff details" })
  @ApiParam({ name: "id", description: "Audit log ID" })
  @ApiResponse({ status: 200, description: "Audit log details", type: AuditLogDetail })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Audit log not found" })
  async findOne(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ): Promise<AuditLogDetail> {
    return this.auditService.findOne(id, req.user.organizationId);
  }
}
