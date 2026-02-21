import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { Audited } from "@/modules/audit/decorators/audited.decorator";
import { ServiceCatalogService } from "./service-catalog.service";
import {
  ApproveServiceRequestDto,
  CreateServiceItemDto,
  CreateServiceRequestDto,
  FulfillServiceRequestDto,
  RejectServiceRequestDto,
} from "./dto/service-catalog.dto";

@ApiTags("service-catalog")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("service_catalog:read")
@Controller("service-catalog")
export class ServiceCatalogController {
  constructor(private readonly serviceCatalogService: ServiceCatalogService) {}

  // Service Items
  @Post("items")
  @ApiOperation({ summary: "Create a service catalog item" })
  @RequirePermissions("service_catalog:write")
  @Audited({
    action: "service_catalog_item.create",
    resource: "serviceCatalogItem",
    captureNewValue: true,
  })
  createItem(@Request() req: any, @Body() dto: CreateServiceItemDto) {
    return this.serviceCatalogService.createItem(
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Get("items")
  @ApiOperation({ summary: "List all service catalog items" })
  findAllItems(@Request() req: any, @Query("category") category?: string) {
    return this.serviceCatalogService.findAllItems(
      req.user.organizationId,
      category
    );
  }

  @Get("items/:id")
  @ApiOperation({ summary: "Get service catalog item details" })
  findOneItem(@Request() req: any, @Param("id") id: string) {
    return this.serviceCatalogService.findOneItem(req.user.organizationId, id);
  }

  // Service Requests
  @Post("requests")
  @ApiOperation({ summary: "Submit a service request" })
  @RequirePermissions("service_catalog:write")
  @Audited({
    action: "service_request.create",
    resource: "serviceRequest",
    captureNewValue: true,
  })
  createRequest(@Request() req: any, @Body() dto: CreateServiceRequestDto) {
    return this.serviceCatalogService.createRequest(
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Get("requests")
  @ApiOperation({ summary: "List all service requests" })
  findAllRequests(@Request() req: any, @Query() query: any) {
    return this.serviceCatalogService.findAllRequests(
      req.user.organizationId,
      query
    );
  }

  @Get("requests/:id")
  @ApiOperation({ summary: "Get service request details" })
  findOneRequest(@Request() req: any, @Param("id") id: string) {
    return this.serviceCatalogService.findOneRequest(
      req.user.organizationId,
      id
    );
  }

  @Post("requests/:id/approve")
  @ApiOperation({ summary: "Approve a service request" })
  @RequirePermissions("service_catalog:update")
  @Audited({
    action: "service_request.approve",
    resource: "serviceRequest",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  approveRequest(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: ApproveServiceRequestDto
  ) {
    return this.serviceCatalogService.approveRequest(
      req.user.organizationId,
      id,
      req.user.userId,
      body.notes
    );
  }

  @Post("requests/:id/reject")
  @ApiOperation({ summary: "Reject a service request" })
  @RequirePermissions("service_catalog:update")
  @Audited({
    action: "service_request.reject",
    resource: "serviceRequest",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  rejectRequest(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: RejectServiceRequestDto
  ) {
    return this.serviceCatalogService.rejectRequest(
      req.user.organizationId,
      id,
      req.user.userId,
      body.reason
    );
  }

  @Post("requests/:id/fulfill")
  @ApiOperation({ summary: "Mark service request as fulfilled" })
  @RequirePermissions("service_catalog:update")
  @Audited({
    action: "service_request.fulfill",
    resource: "serviceRequest",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  fulfillRequest(
    @Request() req: any,
    @Param("id") id: string,
    @Body() body: FulfillServiceRequestDto
  ) {
    return this.serviceCatalogService.fulfillRequest(
      req.user.organizationId,
      id,
      req.user.userId,
      body.notes
    );
  }
}
