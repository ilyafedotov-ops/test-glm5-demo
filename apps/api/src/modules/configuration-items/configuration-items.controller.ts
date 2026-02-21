import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
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
import { Audited } from "@/modules/audit/decorators/audited.decorator";
import { ConfigurationItemsService } from "./configuration-items.service";
import {
  CreateConfigurationItemDto,
  QueryConfigurationItemsDto,
  UpdateConfigurationItemRelationshipsDto,
  UpdateConfigurationItemDto,
} from "./dto/configuration-item.dto";

@ApiTags("configuration-items")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin:all")
@Controller("configuration-items")
export class ConfigurationItemsController {
  constructor(private readonly configurationItemsService: ConfigurationItemsService) {}

  @Get()
  @ApiOperation({ summary: "List configuration items in organization" })
  findAll(@Request() req: any, @Query() query: QueryConfigurationItemsDto) {
    return this.configurationItemsService.findAll(req.user.organizationId, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get configuration item details" })
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.configurationItemsService.findOne(req.user.organizationId, id);
  }

  @Post()
  @ApiOperation({ summary: "Create configuration item" })
  @Audited({
    action: "configuration_item.create",
    resource: "configurationItem",
    captureNewValue: true,
  })
  create(@Request() req: any, @Body() dto: CreateConfigurationItemDto) {
    return this.configurationItemsService.create(req.user.organizationId, dto);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update configuration item" })
  @Audited({
    action: "configuration_item.update",
    resource: "configurationItem",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateConfigurationItemDto
  ) {
    return this.configurationItemsService.update(req.user.organizationId, id, dto);
  }

  @Get(":id/relationships")
  @ApiOperation({ summary: "Get configuration item relationships" })
  findRelationships(@Request() req: any, @Param("id") id: string) {
    return this.configurationItemsService.findRelationships(req.user.organizationId, id);
  }

  @Put(":id/relationships")
  @ApiOperation({ summary: "Replace configuration item relationships" })
  @Audited({
    action: "configuration_item.relationships.update",
    resource: "configurationItem",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  updateRelationships(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateConfigurationItemRelationshipsDto
  ) {
    return this.configurationItemsService.updateRelationships(
      req.user.organizationId,
      id,
      dto.relationships
    );
  }

  @Delete(":id")
  @ApiOperation({ summary: "Delete configuration item" })
  @Audited({
    action: "configuration_item.delete",
    resource: "configurationItem",
    capturePreviousValue: true,
  })
  remove(@Request() req: any, @Param("id") id: string) {
    return this.configurationItemsService.remove(req.user.organizationId, id);
  }
}
