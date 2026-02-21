"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var NotificationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const notification_dto_1 = require("./dto/notification.dto");
const queue_service_1 = require("@/queue/queue.service");
let NotificationsService = NotificationsService_1 = class NotificationsService {
    prisma;
    queueService;
    logger = new common_1.Logger(NotificationsService_1.name);
    constructor(prisma, queueService) {
        this.prisma = prisma;
        this.queueService = queueService;
    }
    onModuleInit() {
        this.logger.log("Notifications service initialized");
    }
    async create(dto) {
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
        const channels = dto.channels || [notification_dto_1.NotificationChannel.IN_APP];
        await this.processChannels(notification, channels);
        return this.toEntity(notification);
    }
    async createBatch(notifications) {
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
    async findAll(userId, query) {
        const where = {
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
    async markAsRead(id, userId) {
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
    async markAllAsRead(userId) {
        await this.prisma.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true },
        });
        this.logger.log(`All notifications marked as read for user ${userId}`);
    }
    async remove(id, userId) {
        await this.prisma.notification.deleteMany({
            where: { id, userId },
        });
    }
    async getPreferences(userId) {
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
    async updatePreferences(userId, dto) {
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
    async processChannels(notification, channels) {
        for (const channel of channels) {
            try {
                switch (channel) {
                    case notification_dto_1.NotificationChannel.EMAIL:
                        await this.processEmail(notification);
                        break;
                    case notification_dto_1.NotificationChannel.PUSH:
                        await this.processPush(notification);
                        break;
                    case notification_dto_1.NotificationChannel.SLACK:
                        await this.processSlack(notification);
                        break;
                    case notification_dto_1.NotificationChannel.IN_APP:
                    default:
                        break;
                }
            }
            catch (error) {
                this.logger.error(`Failed to process ${channel} notification: ${error}`);
            }
        }
    }
    async processEmail(notification) {
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
    async processPush(notification) {
        await this.queueService.addNotificationJob({
            notificationId: notification.id,
            userId: notification.userId,
            type: notification.type,
            channels: [notification_dto_1.NotificationChannel.PUSH],
            data: {
                title: notification.title,
                message: notification.message,
                actionUrl: notification.actionUrl,
            },
        });
    }
    async processSlack(notification) {
        await this.queueService.addNotificationJob({
            notificationId: notification.id,
            userId: notification.userId,
            type: notification.type,
            channels: [notification_dto_1.NotificationChannel.SLACK],
            data: {
                title: notification.title,
                message: notification.message,
                actionUrl: notification.actionUrl,
            },
        });
    }
    toEntity(notification) {
        return {
            id: notification.id,
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            message: notification.message,
            isRead: notification.isRead,
            actionUrl: notification.actionUrl,
            metadata: notification.metadata,
            createdAt: notification.createdAt,
        };
    }
};
exports.NotificationsService = NotificationsService;
exports.NotificationsService = NotificationsService = NotificationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        queue_service_1.QueueService])
], NotificationsService);
//# sourceMappingURL=notifications.service.js.map