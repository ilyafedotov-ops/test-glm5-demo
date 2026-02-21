import { Module, Global } from "@nestjs/common";
import { QueueService } from "./queue.service";
import { ReportProcessor } from "./processors/report.processor";
import { EmailProcessor } from "./processors/email.processor";
import { NotificationProcessor } from "./processors/notification.processor";

@Global()
@Module({
  providers: [QueueService, ReportProcessor, EmailProcessor, NotificationProcessor],
  exports: [QueueService],
})
export class QueueModule {}
