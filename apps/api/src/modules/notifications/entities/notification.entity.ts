import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class NotificationEntity {
  @ApiProperty({ description: "Notification ID" })
  id: string;

  @ApiProperty({ description: "User ID" })
  userId: string;

  @ApiProperty({ description: "Notification type" })
  type: string;

  @ApiProperty({ description: "Notification title" })
  title: string;

  @ApiProperty({ description: "Notification message" })
  message: string;

  @ApiProperty({ description: "Whether the notification has been read" })
  isRead: boolean;

  @ApiPropertyOptional({ description: "Action URL" })
  actionUrl?: string;

  @ApiPropertyOptional({ description: "Additional metadata" })
  metadata?: Record<string, any>;

  @ApiProperty({ description: "Created timestamp" })
  createdAt: Date;
}

export class NotificationListResponse {
  @ApiProperty({ type: [NotificationEntity] })
  data: NotificationEntity[];

  @ApiProperty()
  unreadCount: number;
}

export class NotificationPreferences {
  @ApiProperty({ description: "Email on incident assignment" })
  emailIncidentAssigned: boolean;

  @ApiProperty({ description: "Email on incident resolution" })
  emailIncidentResolved: boolean;

  @ApiProperty({ description: "Email when SLA is breached" })
  emailSlaBreached: boolean;

  @ApiProperty({ description: "Email when change is approved" })
  emailChangeApproved: boolean;

  @ApiProperty({ description: "Daily digest email preference" })
  emailDailyDigest: boolean;

  @ApiProperty({ description: "Enable all in-app notifications" })
  inAppAll: boolean;
}
