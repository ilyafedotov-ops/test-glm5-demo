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
var NotificationProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationProcessor = void 0;
const common_1 = require("@nestjs/common");
const queue_service_1 = require("../queue.service");
const queue_constants_1 = require("../queue.constants");
let NotificationProcessor = NotificationProcessor_1 = class NotificationProcessor {
    queueService;
    logger = new common_1.Logger(NotificationProcessor_1.name);
    constructor(queueService) {
        this.queueService = queueService;
    }
    onModuleInit() {
        this.queueService.registerWorker(queue_constants_1.QUEUE_NAMES.NOTIFICATIONS, this.process.bind(this));
        this.logger.log("Notification processor registered");
    }
    async process(job) {
        const { notificationId, userId, type, channels, data } = job.data;
        this.logger.log(`Processing notification job ${job.id}: notification=${notificationId}, user=${userId}, type=${type}`);
        await job.updateProgress(25);
        if (channels.includes("push")) {
            this.logger.debug(`Push dispatch queued for notification ${notificationId}`);
        }
        if (channels.includes("slack")) {
            this.logger.debug(`Slack dispatch queued for notification ${notificationId}`);
        }
        await job.updateProgress(100);
        return {
            success: true,
            notificationId,
            userId,
            type,
            channels,
            metadata: data,
        };
    }
};
exports.NotificationProcessor = NotificationProcessor;
exports.NotificationProcessor = NotificationProcessor = NotificationProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], NotificationProcessor);
//# sourceMappingURL=notification.processor.js.map