import {
  Controller,
  Get,
  Post,
  Patch,
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
import { PoliciesService } from "./policies.service";
import { CreatePolicyDto } from "./dto/create-policy.dto";
import {
  CreatePolicyExceptionDto,
  ReviewPolicyExceptionDto,
} from "./dto/policy-exception.dto";

@ApiTags("policies")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("policies:read")
@Controller("policies")
export class PoliciesController {
  constructor(private policiesService: PoliciesService) {}

  @Get()
  @ApiOperation({ summary: "Get all policies" })
  async findAll(
    @Request() req: { user: { organizationId: string } },
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.policiesService.findAll(
      req.user.organizationId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20
    );
  }

  @Post()
  @ApiOperation({ summary: "Create a new policy" })
  @RequirePermissions("policies:write")
  @Audited({ action: "policy.create", resource: "policy", captureNewValue: true })
  async create(
    @Request() req: { user: { organizationId: string } },
    @Body() dto: CreatePolicyDto
  ) {
    return this.policiesService.create(req.user.organizationId, dto);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get policy by ID" })
  async findOne(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.policiesService.findOne(id, req.user.organizationId);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update policy" })
  @RequirePermissions("policies:write")
  @Audited({
    action: "policy.update",
    resource: "policy",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  async update(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } },
    @Body() dto: Partial<CreatePolicyDto>
  ) {
    return this.policiesService.update(id, req.user.organizationId, dto);
  }

  @Get(":id/exceptions")
  @ApiOperation({ summary: "List policy exceptions" })
  async findExceptions(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string } }
  ) {
    return this.policiesService.listExceptions(id, req.user.organizationId);
  }

  @Post(":id/exceptions")
  @ApiOperation({ summary: "Create policy exception request" })
  @RequirePermissions("policies:write")
  @Audited({
    action: "policy.exception.create",
    resource: "policy",
    captureNewValue: true,
  })
  async createException(
    @Param("id") id: string,
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() dto: CreatePolicyExceptionDto
  ) {
    return this.policiesService.createException(
      id,
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Post(":id/exceptions/:exceptionId/approve")
  @ApiOperation({ summary: "Approve policy exception" })
  @RequirePermissions("policies:write")
  @Audited({
    action: "policy.exception.approve",
    resource: "policy",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  async approveException(
    @Param("id") id: string,
    @Param("exceptionId") exceptionId: string,
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() dto: ReviewPolicyExceptionDto
  ) {
    return this.policiesService.approveException(
      id,
      exceptionId,
      req.user.organizationId,
      req.user.userId,
      dto.note
    );
  }

  @Post(":id/exceptions/:exceptionId/reject")
  @ApiOperation({ summary: "Reject policy exception" })
  @RequirePermissions("policies:write")
  @Audited({
    action: "policy.exception.reject",
    resource: "policy",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  async rejectException(
    @Param("id") id: string,
    @Param("exceptionId") exceptionId: string,
    @Request() req: { user: { organizationId: string; userId: string } },
    @Body() dto: ReviewPolicyExceptionDto
  ) {
    return this.policiesService.rejectException(
      id,
      exceptionId,
      req.user.organizationId,
      req.user.userId,
      dto.note
    );
  }
}
