import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from "@nestjs/swagger";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/permissions.decorator";
import { NotificationQueryDto, UpdateNotificationPreferencesDto } from "./dto/notification.dto";
import { NotificationEntity, NotificationPreferences } from "./entities/notification.entity";
import { Audited } from "../audit/decorators/audited.decorator";

@ApiTags("notifications")
@Controller("notifications")
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("notifications:read")
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: "Get user notifications" })
  @ApiResponse({ status: 200, description: "List of notifications" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async findAll(
    @Request() req: { user: { userId: string } },
    @Query() query: NotificationQueryDto
  ) {
    return this.notificationsService.findAll(req.user.userId, query);
  }

  @Patch(":id/read")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Mark notification as read" })
  @RequirePermissions("notifications:update")
  @Audited({
    action: "notification.mark_read",
    resource: "notification",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({ status: 200, description: "Notification marked as read", type: NotificationEntity })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  @ApiResponse({ status: 404, description: "Notification not found" })
  async markAsRead(
    @Param("id") id: string,
    @Request() req: { user: { userId: string } }
  ): Promise<NotificationEntity> {
    return this.notificationsService.markAsRead(id, req.user.userId);
  }

  @Patch("read-all")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Mark all notifications as read" })
  @RequirePermissions("notifications:update")
  @Audited({ action: "notification.mark_all_read", resource: "notification" })
  @ApiResponse({ status: 204, description: "All notifications marked as read" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async markAllAsRead(
    @Request() req: { user: { userId: string } }
  ): Promise<void> {
    return this.notificationsService.markAllAsRead(req.user.userId);
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a notification" })
  @RequirePermissions("notifications:delete")
  @Audited({ action: "notification.delete", resource: "notification", capturePreviousValue: true })
  @ApiParam({ name: "id", description: "Notification ID" })
  @ApiResponse({ status: 204, description: "Notification deleted" })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async remove(
    @Param("id") id: string,
    @Request() req: { user: { userId: string } }
  ): Promise<void> {
    return this.notificationsService.remove(id, req.user.userId);
  }

  @Get("preferences")
  @ApiOperation({ summary: "Get notification preferences" })
  @ApiResponse({ status: 200, description: "Notification preferences", type: NotificationPreferences })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async getPreferences(
    @Request() req: { user: { userId: string } }
  ): Promise<NotificationPreferences> {
    return this.notificationsService.getPreferences(req.user.userId);
  }

  @Patch("preferences")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Update notification preferences" })
  @RequirePermissions("notifications:update")
  @Audited({
    action: "notification_preferences.update",
    resource: "notificationPreference",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  @ApiResponse({ status: 200, description: "Preferences updated", type: NotificationPreferences })
  @ApiResponse({ status: 401, description: "Unauthorized" })
  async updatePreferences(
    @Request() req: { user: { userId: string } },
    @Body() dto: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreferences> {
    return this.notificationsService.updatePreferences(req.user.userId, dto);
  }
}
