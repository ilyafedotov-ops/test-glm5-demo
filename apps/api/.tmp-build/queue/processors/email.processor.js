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
var EmailProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailProcessor = void 0;
const common_1 = require("@nestjs/common");
const queue_service_1 = require("../queue.service");
const queue_constants_1 = require("../queue.constants");
let EmailProcessor = EmailProcessor_1 = class EmailProcessor {
    queueService;
    logger = new common_1.Logger(EmailProcessor_1.name);
    constructor(queueService) {
        this.queueService = queueService;
    }
    onModuleInit() {
        this.queueService.registerWorker(queue_constants_1.QUEUE_NAMES.EMAIL, this.process.bind(this));
        this.logger.log("Email processor registered");
    }
    async process(job) {
        this.logger.log(`Processing email job: ${job.id}`);
        const { to, subject, template, data } = job.data;
        try {
            await job.updateProgress(20);
            this.logger.debug(`Sending email to ${to}`);
            this.logger.debug(`Subject: ${subject}`);
            this.logger.debug(`Template: ${template}`);
            await job.updateProgress(50);
            await new Promise((resolve) => setTimeout(resolve, 500));
            await job.updateProgress(100);
            this.logger.log(`Email sent successfully to ${to}`);
            return {
                success: true,
                messageId: `msg_${Date.now()}`,
                to,
                subject,
            };
        }
        catch (error) {
            this.logger.error(`Failed to send email to ${to}: ${error.message}`);
            throw error;
        }
    }
};
exports.EmailProcessor = EmailProcessor;
exports.EmailProcessor = EmailProcessor = EmailProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [queue_service_1.QueueService])
], EmailProcessor);
//# sourceMappingURL=email.processor.js.map