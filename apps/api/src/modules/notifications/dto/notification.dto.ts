import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsString, IsOptional, IsEnum, IsObject, IsBoolean, MaxLength } from "class-validator";

export enum NotificationType {
  INCIDENT_CREATED = "incident_created",
  INCIDENT_ASSIGNED = "incident_assigned",
  INCIDENT_UPDATED = "incident_updated",
  INCIDENT_RESOLVED = "incident_resolved",
  SLA_BREACH_WARNING = "sla_breach_warning",
  SLA_BREACHED = "sla_breached",
  POLICY_VIOLATION = "policy_violation",
  VIOLATION_ASSIGNED = "violation_assigned",
  WORKFLOW_ASSIGNED = "workflow_assigned",
  WORKFLOW_COMPLETED = "workflow_completed",
  REPORT_READY = "report_ready",
  SYSTEM_ALERT = "system_alert",
}

export enum NotificationChannel {
  IN_APP = "in_app",
  EMAIL = "email",
  PUSH = "push",
  SLACK = "slack",
}

export class CreateNotificationDto {
  @ApiProperty({ description: "User ID to notify" })
  @IsString()
  userId: string;

  @ApiProperty({ description: "Notification type", enum: NotificationType })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ description: "Notification title" })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({ description: "Notification message" })
  @IsString()
  message: string;

  @ApiPropertyOptional({ description: "URL to navigate when clicked" })
  @IsOptional()
  @IsString()
  actionUrl?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: "Channels to send to", enum: NotificationChannel, isArray: true })
  @IsOptional()
  channels?: NotificationChannel[];
}

export class UpdateNotificationPreferencesDto {
  @ApiPropertyOptional({ description: "Email on incident assignment" })
  @IsOptional()
  @IsBoolean()
  emailIncidentAssigned?: boolean;

  @ApiPropertyOptional({ description: "Email on incident resolution" })
  @IsOptional()
  @IsBoolean()
  emailIncidentResolved?: boolean;

  @ApiPropertyOptional({ description: "Email when SLA is breached" })
  @IsOptional()
  @IsBoolean()
  emailSlaBreached?: boolean;

  @ApiPropertyOptional({ description: "Email when change is approved" })
  @IsOptional()
  @IsBoolean()
  emailChangeApproved?: boolean;

  @ApiPropertyOptional({ description: "Daily digest email preference" })
  @IsOptional()
  @IsBoolean()
  emailDailyDigest?: boolean;

  @ApiPropertyOptional({ description: "Enable all in-app notifications" })
  @IsOptional()
  @IsBoolean()
  inAppAll?: boolean;
}

export class NotificationQueryDto {
  @ApiPropertyOptional({ description: "Filter by read status" })
  @IsOptional()
  @IsBoolean()
  unread?: boolean;

  @ApiPropertyOptional({ description: "Filter by type" })
  @IsOptional()
  @IsEnum(NotificationType)
  type?: NotificationType;
}
