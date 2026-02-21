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
var QueueService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const bullmq_1 = require("bullmq");
const queue_constants_1 = require("./queue.constants");
let QueueService = QueueService_1 = class QueueService {
    configService;
    logger = new common_1.Logger(QueueService_1.name);
    queues = new Map();
    workers = new Map();
    connection;
    constructor(configService) {
        this.configService = configService;
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
        for (const name of Object.values(queue_constants_1.QUEUE_NAMES)) {
            this.createQueue(name);
        }
        this.logger.log("All queues initialized");
    }
    async onModuleDestroy() {
        for (const [name, worker] of this.workers) {
            await worker.close();
            this.logger.log(`Worker closed: ${name}`);
        }
        for (const [name, queue] of this.queues) {
            await queue.close();
            this.logger.log(`Queue closed: ${name}`);
        }
    }
    createQueue(name) {
        if (this.queues.has(name)) {
            return this.queues.get(name);
        }
        const queue = new bullmq_1.Queue(name, this.connection);
        this.queues.set(name, queue);
        this.logger.log(`Queue created: ${name}`);
        return queue;
    }
    getQueue(name) {
        if (!this.queues.has(name)) {
            return this.createQueue(name);
        }
        return this.queues.get(name);
    }
    async addReportJob(data) {
        const queue = this.getQueue(queue_constants_1.QUEUE_NAMES.REPORTS);
        const job = await queue.add("generate-report", data, {
            ...queue_constants_1.DEFAULT_JOB_OPTIONS,
            jobId: data.jobId,
        });
        this.logger.log(`Report job added: ${job.id}`);
        return job;
    }
    async addNotificationJob(data) {
        const queue = this.getQueue(queue_constants_1.QUEUE_NAMES.NOTIFICATIONS);
        const job = await queue.add("send-notification", data, queue_constants_1.DEFAULT_JOB_OPTIONS);
        this.logger.log(`Notification job added: ${job.id}`);
        return job;
    }
    async addWorkflowJob(data) {
        const queue = this.getQueue(queue_constants_1.QUEUE_NAMES.WORKFLOWS);
        const job = await queue.add("process-workflow", data, queue_constants_1.DEFAULT_JOB_OPTIONS);
        this.logger.log(`Workflow job added: ${job.id}`);
        return job;
    }
    async addEmailJob(data) {
        const queue = this.getQueue(queue_constants_1.QUEUE_NAMES.EMAIL);
        const job = await queue.add("send-email", data, queue_constants_1.DEFAULT_JOB_OPTIONS);
        this.logger.log(`Email job added: ${job.id}`);
        return job;
    }
    async getJobStatus(queueName, jobId) {
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
    async getQueueStats(queueName) {
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
    async getAllQueuesStats() {
        const stats = {};
        for (const name of Object.values(queue_constants_1.QUEUE_NAMES)) {
            stats[name] = await this.getQueueStats(name);
        }
        return stats;
    }
    registerWorker(queueName, processor) {
        if (this.workers.has(queueName)) {
            this.logger.warn(`Worker already exists for queue: ${queueName}`);
            return this.workers.get(queueName);
        }
        const worker = new bullmq_1.Worker(queueName, processor, {
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
};
exports.QueueService = QueueService;
exports.QueueService = QueueService = QueueService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], QueueService);
//# sourceMappingURL=queue.service.js.map