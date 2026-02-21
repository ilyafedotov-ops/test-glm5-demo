import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { Audited } from "@/modules/audit/decorators/audited.decorator";
import { SettingsService } from "./settings.service";

@ApiTags("settings")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("admin:all")
@Controller("settings")
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // Webhooks
  @Post("webhooks")
  @ApiOperation({ summary: "Create a webhook" })
  @Audited({ action: "webhook.create", resource: "webhook", captureNewValue: true })
  createWebhook(@Request() req: any, @Body() data: any) {
    return this.settingsService.createWebhook(
      req.user.organizationId,
      req.user.userId,
      data
    );
  }

  @Get("webhooks")
  @ApiOperation({ summary: "List all webhooks" })
  findAllWebhooks(@Request() req: any) {
    return this.settingsService.findAllWebhooks(req.user.organizationId);
  }

  @Put("webhooks/:id")
  @ApiOperation({ summary: "Update a webhook" })
  @Audited({
    action: "webhook.update",
    resource: "webhook",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  updateWebhook(
    @Request() req: any,
    @Param("id") id: string,
    @Body() data: any
  ) {
    return this.settingsService.updateWebhook(
      req.user.organizationId,
      id,
      data
    );
  }

  @Delete("webhooks/:id")
  @ApiOperation({ summary: "Delete a webhook" })
  @Audited({ action: "webhook.delete", resource: "webhook", capturePreviousValue: true })
  deleteWebhook(@Request() req: any, @Param("id") id: string) {
    return this.settingsService.deleteWebhook(req.user.organizationId, id);
  }

  @Post("webhooks/:id/test")
  @ApiOperation({ summary: "Send a test payload to the webhook" })
  async testWebhook(
    @Request() req: { user: { organizationId: string } },
    @Param("id") id: string
  ) {
    return this.settingsService.testWebhook(req.user.organizationId, id);
  }
}
