import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bullmq";
import { QueueService } from "../queue.service";
import { NotificationJobData, QUEUE_NAMES } from "../queue.constants";

@Injectable()
export class NotificationProcessor implements OnModuleInit {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly queueService: QueueService) {}

  onModuleInit() {
    this.queueService.registerWorker(QUEUE_NAMES.NOTIFICATIONS, this.process.bind(this));
    this.logger.log("Notification processor registered");
  }

  async process(job: Job<NotificationJobData>): Promise<any> {
    const { notificationId, userId, type, channels, data } = job.data;

    this.logger.log(
      `Processing notification job ${job.id}: notification=${notificationId}, user=${userId}, type=${type}`
    );

    // External channel integrations should be implemented here (push/slack/webhook dispatch).
    // For now we process the queue job and keep traceable logs.
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
}
