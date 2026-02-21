import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Queue, QueueBaseOptions, Worker, Job } from "bullmq";
import { QUEUE_NAMES, QueueName, ReportJobData, NotificationJobData, WorkflowJobData, EmailJobData, DEFAULT_JOB_OPTIONS } from "./queue.constants";

@Injectable()
export class QueueService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(QueueService.name);
  private readonly queues: Map<QueueName, Queue> = new Map();
  private readonly workers: Map<QueueName, Worker> = new Map();
  private connection: QueueBaseOptions;

  constructor(private configService: ConfigService) {
    const redisHost = this.configService.get("REDIS_HOST", "localhost");
    const redisPort = this.configService.get("REDIS_PORT", 6379);

    this.connection = {
      connection: {
        host: redisHost,
        port: parseInt(redisPort.toString(), 10),
      },
    };

    this.logger.log(`Queue service configured with Redis: ${redisHost}:${redisPort}`);
  }

  async onModuleInit() {
    // Initialize queues
    for (const name of Object.values(QUEUE_NAMES)) {
      this.createQueue(name as QueueName);
    }

    this.logger.log("All queues initialized");
  }

  async onModuleDestroy() {
    // Close all workers
    for (const [name, worker] of this.workers) {
      await worker.close();
      this.logger.log(`Worker closed: ${name}`);
    }

    // Close all queues
    for (const [name, queue] of this.queues) {
      await queue.close();
      this.logger.log(`Queue closed: ${name}`);
    }
  }

  private createQueue(name: QueueName): Queue {
    if (this.queues.has(name)) {
      return this.queues.get(name)!;
    }

    const queue = new Queue(name, this.connection);
    this.queues.set(name, queue);

    this.logger.log(`Queue created: ${name}`);
    return queue;
  }

  getQueue(name: QueueName): Queue {
    if (!this.queues.has(name)) {
      return this.createQueue(name);
    }
    return this.queues.get(name)!;
  }

  // Add report generation job
  async addReportJob(data: ReportJobData): Promise<Job> {
    const queue = this.getQueue(QUEUE_NAMES.REPORTS);
    const job = await queue.add("generate-report", data, {
      ...DEFAULT_JOB_OPTIONS,
      jobId: data.jobId,
    });
    this.logger.log(`Report job added: ${job.id}`);
    return job;
  }

  // Add notification job
  async addNotificationJob(data: NotificationJobData): Promise<Job> {
    const queue = this.getQueue(QUEUE_NAMES.NOTIFICATIONS);
    const job = await queue.add("send-notification", data, DEFAULT_JOB_OPTIONS);
    this.logger.log(`Notification job added: ${job.id}`);
    return job;
  }

  // Add workflow job
  async addWorkflowJob(data: WorkflowJobData): Promise<Job> {
    const queue = this.getQueue(QUEUE_NAMES.WORKFLOWS);
    const job = await queue.add("process-workflow", data, DEFAULT_JOB_OPTIONS);
    this.logger.log(`Workflow job added: ${job.id}`);
    return job;
  }

  // Add email job
  async addEmailJob(data: EmailJobData): Promise<Job> {
    const queue = this.getQueue(QUEUE_NAMES.EMAIL);
    const job = await queue.add("send-email", data, DEFAULT_JOB_OPTIONS);
    this.logger.log(`Email job added: ${job.id}`);
    return job;
  }

  // Get job status
  async getJobStatus(queueName: QueueName, jobId: string): Promise<{
    id: string;
    name: string;
    status: string;
    progress: number;
    returnValue: any;
    failedReason?: string;
  } | null> {
    const queue = this.getQueue(queueName);
    const job = await queue.getJob(jobId);

    if (!job) {
      return null;
    }

    const state = await job.getState();

    return {
      id: job.id,
      name: job.name,
      status: state,
      progress: typeof job.progress === "number" ? job.progress : 0,
      returnValue: job.returnvalue,
      failedReason: job.failedReason,
    };
  }

  // Get queue statistics
  async getQueueStats(queueName: QueueName): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    const queue = this.getQueue(queueName);

    const [waiting, active, completed, failed, delayed] = await Promise.all([
      queue.getWaitingCount(),
      queue.getActiveCount(),
      queue.getCompletedCount(),
      queue.getFailedCount(),
      queue.getDelayedCount(),
    ]);

    return { waiting, active, completed, failed, delayed };
  }

  // Get all queues stats
  async getAllQueuesStats(): Promise<Record<QueueName, any>> {
    const stats: Record<string, any> = {};

    for (const name of Object.values(QUEUE_NAMES)) {
      stats[name] = await this.getQueueStats(name as QueueName);
    }

    return stats;
  }

  // Register a worker processor
  registerWorker(
    queueName: QueueName,
    processor: (job: Job) => Promise<any>
  ): Worker {
    if (this.workers.has(queueName)) {
      this.logger.warn(`Worker already exists for queue: ${queueName}`);
      return this.workers.get(queueName)!;
    }

    const worker = new Worker(queueName, processor, {
      ...this.connection,
      concurrency: 5,
    });

    worker.on("completed", (job) => {
      this.logger.log(`Job completed: ${job.id} in queue ${queueName}`);
    });

    worker.on("failed", (job, err) => {
      this.logger.error(`Job failed: ${job?.id} in queue ${queueName}: ${err.message}`);
    });

    this.workers.set(queueName, worker);
    this.logger.log(`Worker registered for queue: ${queueName}`);

    return worker;
  }
}
