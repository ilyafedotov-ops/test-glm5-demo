import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateNotificationDto, NotificationChannel, NotificationQueryDto, UpdateNotificationPreferencesDto } from "./dto/notification.dto";
import { NotificationEntity, NotificationPreferences } from "./entities/notification.entity";
import { Prisma } from "@prisma/client";
import { QueueService } from "@/queue/queue.service";

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private prisma: PrismaService,
    private queueService: QueueService,
  ) {}

  onModuleInit() {
    // Initialize processors (in production, these would be injected)
    this.logger.log("Notifications service initialized");
  }

  async create(dto: CreateNotificationDto): Promise<NotificationEntity> {
    // Create in-app notification
    const notification = await this.prisma.notification.create({
      data: {
        userId: dto.userId,
        type: dto.type,
        title: dto.title,
        message: dto.message,
        actionUrl: dto.actionUrl,
        metadata: dto.metadata || {},
        isRead: false,
      },
    });

    this.logger.log(`Notification created: ${notification.id} for user ${dto.userId}`);

    // Process through different channels
    const channels = dto.channels || [NotificationChannel.IN_APP];
    await this.processChannels(notification, channels);

    return this.toEntity(notification);
  }

  async createBatch(notifications: CreateNotificationDto[]): Promise<void> {
    await this.prisma.notification.createMany({
      data: notifications.map((n) => ({
        userId: n.userId,
        type: n.type,
        title: n.title,
        message: n.message,
        actionUrl: n.actionUrl,
        metadata: n.metadata || {},
        isRead: false,
      })),
    });

    this.logger.log(`Batch created ${notifications.length} notifications`);
  }

  async findAll(
    userId: string,
    query?: NotificationQueryDto
  ): Promise<{ data: NotificationEntity[]; unreadCount: number }> {
    const where: Prisma.NotificationWhereInput = {
      userId,
      ...(query?.unread !== undefined && { isRead: !query.unread }),
      ...(query?.type && { type: query.type }),
    };

    const [notifications, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      this.prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return {
      data: notifications.map((n) => this.toEntity(n)),
      unreadCount,
    };
  }

  async markAsRead(id: string, userId: string): Promise<NotificationEntity> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      throw new Error("Notification not found");
    }

    const updated = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    return this.toEntity(updated);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });

    this.logger.log(`All notifications marked as read for user ${userId}`);
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.prisma.notification.deleteMany({
      where: { id, userId },
    });
  }

  async getPreferences(userId: string): Promise<NotificationPreferences> {
    const existing = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });

    if (existing) {
      return {
        emailIncidentAssigned: existing.emailIncidentAssigned,
        emailIncidentResolved: existing.emailIncidentResolved,
        emailSlaBreached: existing.emailSlaBreached,
        emailChangeApproved: existing.emailChangeApproved,
        emailDailyDigest: existing.emailDailyDigest,
        inAppAll: existing.inAppAll,
      };
    }

    // If preferences do not exist yet, create defaults scoped to the user's organization.
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new Error("User not found");
    }

    const created = await this.prisma.notificationPreference.create({
      data: {
        userId,
        organizationId: user.organizationId,
        emailIncidentAssigned: true,
        emailIncidentResolved: true,
        emailSlaBreached: true,
        emailChangeApproved: true,
        emailDailyDigest: false,
        inAppAll: true,
      },
    });

    return {
      emailIncidentAssigned: created.emailIncidentAssigned,
      emailIncidentResolved: created.emailIncidentResolved,
      emailSlaBreached: created.emailSlaBreached,
      emailChangeApproved: created.emailChangeApproved,
      emailDailyDigest: created.emailDailyDigest,
      inAppAll: created.inAppAll,
    };
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto
  ): Promise<NotificationPreferences> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { organizationId: true },
    });

    if (!user?.organizationId) {
      throw new Error("User not found");
    }

    const updated = await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        organizationId: user.organizationId,
        emailIncidentAssigned: dto.emailIncidentAssigned ?? true,
        emailIncidentResolved: dto.emailIncidentResolved ?? true,
        emailSlaBreached: dto.emailSlaBreached ?? true,
        emailChangeApproved: dto.emailChangeApproved ?? true,
        emailDailyDigest: dto.emailDailyDigest ?? false,
        inAppAll: dto.inAppAll ?? true,
      },
      update: {
        ...(dto.emailIncidentAssigned !== undefined
          ? { emailIncidentAssigned: dto.emailIncidentAssigned }
          : {}),
        ...(dto.emailIncidentResolved !== undefined
          ? { emailIncidentResolved: dto.emailIncidentResolved }
          : {}),
        ...(dto.emailSlaBreached !== undefined
          ? { emailSlaBreached: dto.emailSlaBreached }
          : {}),
        ...(dto.emailChangeApproved !== undefined
          ? { emailChangeApproved: dto.emailChangeApproved }
          : {}),
        ...(dto.emailDailyDigest !== undefined
          ? { emailDailyDigest: dto.emailDailyDigest }
          : {}),
        ...(dto.inAppAll !== undefined ? { inAppAll: dto.inAppAll } : {}),
      },
    });

    this.logger.log(`Preferences updated for user ${userId}`);

    return {
      emailIncidentAssigned: updated.emailIncidentAssigned,
      emailIncidentResolved: updated.emailIncidentResolved,
      emailSlaBreached: updated.emailSlaBreached,
      emailChangeApproved: updated.emailChangeApproved,
      emailDailyDigest: updated.emailDailyDigest,
      inAppAll: updated.inAppAll,
    };
  }

  private async processChannels(
    notification: any,
    channels: NotificationChannel[]
  ): Promise<void> {
    for (const channel of channels) {
      try {
        switch (channel) {
          case NotificationChannel.EMAIL:
            await this.processEmail(notification);
            break;
          case NotificationChannel.PUSH:
            await this.processPush(notification);
            break;
          case NotificationChannel.SLACK:
            await this.processSlack(notification);
            break;
          case NotificationChannel.IN_APP:
          default:
            // Already handled by database create
            break;
        }
      } catch (error) {
        this.logger.error(`Failed to process ${channel} notification: ${error}`);
      }
    }
  }

  private async processEmail(notification: any): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: notification.userId },
      select: { email: true },
    });

    if (!user?.email) {
      this.logger.warn(`Skipping email notification ${notification.id}: recipient missing email`);
      return;
    }

    await this.queueService.addEmailJob({
      to: user.email,
      subject: notification.title,
      template: "notification",
      data: {
        notificationId: notification.id,
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
        metadata: notification.metadata,
      },
    });
  }

  private async processPush(notification: any): Promise<void> {
    await this.queueService.addNotificationJob({
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      channels: [NotificationChannel.PUSH],
      data: {
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
    });
  }

  private async processSlack(notification: any): Promise<void> {
    await this.queueService.addNotificationJob({
      notificationId: notification.id,
      userId: notification.userId,
      type: notification.type,
      channels: [NotificationChannel.SLACK],
      data: {
        title: notification.title,
        message: notification.message,
        actionUrl: notification.actionUrl,
      },
    });
  }

  private toEntity(notification: any): NotificationEntity {
    return {
      id: notification.id,
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      isRead: notification.isRead,
      actionUrl: notification.actionUrl,
      metadata: notification.metadata as Record<string, any>,
      createdAt: notification.createdAt,
    };
  }
}
