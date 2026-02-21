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
var SettingsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
let SettingsService = SettingsService_1 = class SettingsService {
    prisma;
    logger = new common_1.Logger(SettingsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createWebhook(organizationId, userId, data) {
        return this.prisma.webhook.create({
            data: {
                name: data.name,
                url: data.url,
                secret: data.secret,
                events: data.events,
                organizationId,
            },
        });
    }
    async findAllWebhooks(organizationId) {
        return this.prisma.webhook.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
        });
    }
    async updateWebhook(organizationId, id, data) {
        return this.prisma.webhook.update({
            where: { id, organizationId },
            data,
        });
    }
    async deleteWebhook(organizationId, id) {
        return this.prisma.webhook.delete({
            where: { id, organizationId },
        });
    }
    async testWebhook(organizationId, id) {
        const webhook = await this.prisma.webhook.findFirst({
            where: { id, organizationId },
        });
        if (!webhook) {
            throw new Error("Webhook not found");
        }
        const testPayload = {
            event: "webhook.test",
            timestamp: new Date().toISOString(),
            data: {
                message: "This is a test payload from NexusOps",
                webhookId: webhook.id,
                webhookName: webhook.name,
            },
        };
        try {
            const response = await fetch(webhook.url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "X-Webhook-Secret": webhook.secret || "",
                    "X-Webhook-Event": "webhook.test",
                },
                body: JSON.stringify(testPayload),
            });
            if (response.ok) {
                await this.prisma.webhook.update({
                    where: { id },
                    data: { lastTriggeredAt: new Date() },
                });
                this.logger.log(`Webhook ${webhook.name} test succeeded`);
                return { success: true, status: response.status, message: "Test payload sent successfully" };
            }
            else {
                const text = await response.text();
                this.logger.warn(`Webhook ${webhook.name} test failed: ${response.status} ${text}`);
                return { success: false, status: response.status, message: text || response.statusText };
            }
        }
        catch (error) {
            this.logger.error(`Webhook ${webhook.name} test error: ${error.message}`);
            return { success: false, message: error.message };
        }
    }
    async triggerWebhooks(organizationId, event, payload) {
        const webhooks = await this.prisma.webhook.findMany({
            where: {
                organizationId,
                events: { has: event },
                isActive: true,
            },
        });
        webhooks.forEach(async (webhook) => {
            try {
                const response = await fetch(webhook.url, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "X-Webhook-Secret": webhook.secret || "",
                        "X-Webhook-Event": event,
                    },
                    body: JSON.stringify({
                        event,
                        timestamp: new Date().toISOString(),
                        data: payload,
                    }),
                });
                if (response.ok) {
                    await this.prisma.webhook.update({
                        where: { id: webhook.id },
                        data: { lastTriggeredAt: new Date() },
                    });
                    this.logger.log(`Webhook ${webhook.name} triggered successfully for ${event}`);
                }
                else {
                    this.logger.warn(`Webhook ${webhook.name} failed: ${response.statusText}`);
                }
            }
            catch (error) {
                this.logger.error(`Webhook ${webhook.name} error: ${error.message}`);
            }
        });
        return { triggered: webhooks.length };
    }
};
exports.SettingsService = SettingsService;
exports.SettingsService = SettingsService = SettingsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SettingsService);
//# sourceMappingURL=settings.service.js.map