import { Injectable, Logger, OnModuleInit } from "@nestjs/common";
import { Job } from "bullmq";
import { QueueService } from "../queue.service";
import { QUEUE_NAMES, EmailJobData } from "../queue.constants";

@Injectable()
export class EmailProcessor implements OnModuleInit {
  private readonly logger = new Logger(EmailProcessor.name);

  constructor(private readonly queueService: QueueService) {}

  onModuleInit() {
    this.queueService.registerWorker(QUEUE_NAMES.EMAIL, this.process.bind(this));
    this.logger.log("Email processor registered");
  }

  async process(job: Job<EmailJobData>): Promise<any> {
    this.logger.log(`Processing email job: ${job.id}`);

    const { to, subject, template } = job.data;

    try {
      // In production, integrate with email service (SendGrid, AWS SES, etc.)
      // This is a mock implementation
      await job.updateProgress(20);

      this.logger.debug(`Sending email to ${to}`);
      this.logger.debug(`Subject: ${subject}`);
      this.logger.debug(`Template: ${template}`);

      await job.updateProgress(50);

      // Simulate email sending delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      await job.updateProgress(100);

      this.logger.log(`Email sent successfully to ${to}`);

      return {
        success: true,
        messageId: `msg_${Date.now()}`,
        to,
        subject,
      };
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
      throw error;
    }
  }
}
