import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  // Webhooks
  async createWebhook(organizationId: string, userId: string, data: any) {
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

  async findAllWebhooks(organizationId: string) {
    return this.prisma.webhook.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
    });
  }

  async updateWebhook(organizationId: string, id: string, data: any) {
    return this.prisma.webhook.update({
      where: { id, organizationId },
      data,
    });
  }

  async deleteWebhook(organizationId: string, id: string) {
    return this.prisma.webhook.delete({
      where: { id, organizationId },
    });
  }

  async testWebhook(organizationId: string, id: string) {
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
      } else {
        const text = await response.text();
        this.logger.warn(`Webhook ${webhook.name} test failed: ${response.status} ${text}`);
        return { success: false, status: response.status, message: text || response.statusText };
      }
    } catch (error: any) {
      this.logger.error(`Webhook ${webhook.name} test error: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  async triggerWebhooks(
    organizationId: string,
    event: string,
    payload: any
  ) {
    const webhooks = await this.prisma.webhook.findMany({
      where: {
        organizationId,
        events: { has: event },
        isActive: true,
      },
    });

    // Fire and forget webhook calls
    webhooks.forEach(async (webhook) => {
      try {
        // In production, use a queue or proper HTTP client with retries
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
        } else {
          this.logger.warn(`Webhook ${webhook.name} failed: ${response.statusText}`);
        }
      } catch (error) {
        this.logger.error(`Webhook ${webhook.name} error: ${error.message}`);
      }
    });

    return { triggered: webhooks.length };
  }
}
