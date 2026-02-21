import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { AdminGovernanceService } from "./admin-governance.service";
import {
  CreatePrivilegedAccessRequestDto,
  ReviewPrivilegedAccessRequestDto,
  UpdateCabMembersDto,
  UpdateCabPolicyDto,
} from "./dto/admin-governance.dto";

@ApiTags("admin-governance")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin:all")
@Controller("admin-governance")
export class AdminGovernanceController {
  constructor(private readonly adminGovernanceService: AdminGovernanceService) {}

  @Get("privileged-access-requests")
  @ApiOperation({ summary: "List privileged access approval requests" })
  listPrivilegedAccessRequests(
    @Request() req: { user: { organizationId: string } },
    @Query("status") status?: string
  ) {
    return this.adminGovernanceService.listPrivilegedAccessRequests(
      req.user.organizationId,
      status
    );
  }

  @Post("privileged-access-requests")
  @ApiOperation({ summary: "Create a privileged access approval request" })
  createPrivilegedAccessRequest(
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() dto: CreatePrivilegedAccessRequestDto
  ) {
    return this.adminGovernanceService.createPrivilegedAccessRequest(
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Post("privileged-access-requests/:id/review")
  @ApiOperation({ summary: "Approve or reject a privileged access request" })
  reviewPrivilegedAccessRequest(
    @Request() req: { user: { organizationId: string; userId: string } },
    @Param("id") requestId: string,
    @Body() dto: ReviewPrivilegedAccessRequestDto
  ) {
    return this.adminGovernanceService.reviewPrivilegedAccessRequest(
      req.user.organizationId,
      req.user.userId,
      requestId,
      dto
    );
  }

  @Get("cab")
  @ApiOperation({ summary: "Get CAB governance policy and members" })
  getCabConfiguration(@Request() req: { user: { organizationId: string } }) {
    return this.adminGovernanceService.getCabConfiguration(req.user.organizationId);
  }

  @Put("cab/policy")
  @ApiOperation({ summary: "Update CAB governance policy" })
  updateCabPolicy(
    @Request() req: { user: { organizationId: string } },
    @Body() dto: UpdateCabPolicyDto
  ) {
    return this.adminGovernanceService.updateCabPolicy(req.user.organizationId, dto);
  }

  @Put("cab/members")
  @ApiOperation({ summary: "Replace CAB membership roster" })
  updateCabMembers(
    @Request() req: { user: { organizationId: string } },
    @Body() dto: UpdateCabMembersDto
  ) {
    return this.adminGovernanceService.updateCabMembers(req.user.organizationId, dto);
  }
}
