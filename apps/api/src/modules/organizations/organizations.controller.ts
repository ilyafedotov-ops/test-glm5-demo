import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { Audited } from "../audit/decorators/audited.decorator";
import { OrganizationsService } from "./organizations.service";
import { UpdateOrganizationDto } from "./dto/organization.dto";

@ApiTags("organizations")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin:all")
@Controller("organizations")
export class OrganizationsController {
  constructor(private orgsService: OrganizationsService) {}

  @Get("me")
  @ApiOperation({ summary: "Get current user's organization" })
  @ApiResponse({ status: 200, description: "Organization details" })
  @ApiResponse({ status: 404, description: "Organization not found" })
  async getCurrentOrganization(
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.orgsService.findOne(req.user.organizationId);
  }

  @Patch("me")
  @ApiOperation({ summary: "Update current organization" })
  @Audited({
    action: "organization.update",
    resource: "organization",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiResponse({ status: 200, description: "Organization updated" })
  async updateCurrentOrganization(
    @Request() req: { user: { organizationId: string } },
    @Body() dto: UpdateOrganizationDto
  ) {
    return this.orgsService.update(req.user.organizationId, dto);
  }

  @Get("me/stats")
  @ApiOperation({ summary: "Get organization statistics" })
  @ApiResponse({ status: 200, description: "Organization stats" })
  async getOrganizationStats(
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.orgsService.getStats(req.user.organizationId);
  }
}
