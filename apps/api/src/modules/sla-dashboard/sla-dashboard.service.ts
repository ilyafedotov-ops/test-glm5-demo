import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { SLACalculationService } from "../sla/sla-calculation.service";
import { SLATargetDto } from "./dto/sla-targets.dto";

@Injectable()
export class SLADashboardService {
  private readonly logger = new Logger(SLADashboardService.name);

  constructor(
    private prisma: PrismaService,
    private slaCalculation: SLACalculationService,
  ) {}

  async getSLAMetrics(organizationId: string, period: string = "7d") {
    const days = parseInt(period.replace("d", "")) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Get all incidents with SLA data
    const incidents = await this.prisma.incident.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
        slaResponseDue: { not: null },
      },
      select: {
        id: true,
        ticketNumber: true,
        title: true,
        priority: true,
        status: true,
        slaResponseDue: true,
        slaResolutionDue: true,
        slaResponseAt: true,
        resolvedAt: true,
        slaResponseMet: true,
        slaResolutionMet: true,
        createdAt: true,
      },
    });

    // Calculate metrics
    const totalIncidents = incidents.length;
    const responseSLAMet = incidents.filter((i) => i.slaResponseMet === true).length;
    const resolutionSLAMet = incidents.filter((i) => i.slaResolutionMet === true).length;

    const responseSLACompliance = totalIncidents > 0 
      ? ((responseSLAMet / totalIncidents) * 100).toFixed(1)
      : "0";
    
    const resolutionSLACompliance = totalIncidents > 0
      ? ((resolutionSLAMet / totalIncidents) * 100).toFixed(1)
      : "0";

    // Get breached SLAs
    const breachedResponse = incidents.filter(
      (i) => i.slaResponseDue && new Date() > new Date(i.slaResponseDue) && !i.slaResponseAt
    );

    const breachedResolution = incidents.filter(
      (i) => i.slaResolutionDue && new Date() > new Date(i.slaResolutionDue) && !i.resolvedAt
    );

    // Get at-risk SLAs (less than 30 minutes remaining)
    const atRiskResponse = incidents.filter((i) => {
      if (!i.slaResponseDue || i.slaResponseAt) return false;
      const remaining = new Date(i.slaResponseDue).getTime() - new Date().getTime();
      return remaining > 0 && remaining < 30 * 60 * 1000;
    });

    const atRiskResolution = incidents.filter((i) => {
      if (!i.slaResolutionDue || i.resolvedAt) return false;
      const remaining = new Date(i.slaResolutionDue).getTime() - new Date().getTime();
      return remaining > 0 && remaining < 30 * 60 * 1000;
    });

    // SLA by priority
    const slaByPriority = await this.calculateSLAByPriority(organizationId, startDate);

    // Daily trend
    const dailyTrend = await this.calculateDailyTrend(organizationId, startDate);

    return {
      overview: {
        totalIncidents,
        responseSLACompliance: `${responseSLACompliance}%`,
        resolutionSLACompliance: `${resolutionSLACompliance}%`,
        responseSLAMet,
        resolutionSLAMet,
      },
      breaches: {
        response: breachedResponse.length,
        resolution: breachedResolution.length,
        total: breachedResponse.length + breachedResolution.length,
        incidents: [...breachedResponse, ...breachedResolution].slice(0, 10),
      },
      atRisk: {
        response: atRiskResponse.length,
        resolution: atRiskResolution.length,
        total: atRiskResponse.length + atRiskResolution.length,
        incidents: [...atRiskResponse, ...atRiskResolution].slice(0, 10),
      },
      byPriority: slaByPriority,
      dailyTrend,
    };
  }

  private async calculateSLAByPriority(organizationId: string, startDate: Date) {
    const priorities = ["critical", "high", "medium", "low"];
    const result: any = {};

    for (const priority of priorities) {
      const incidents = await this.prisma.incident.findMany({
        where: {
          organizationId,
          priority,
          createdAt: { gte: startDate },
          slaResponseDue: { not: null },
        },
        select: {
          slaResponseMet: true,
          slaResolutionMet: true,
        },
      });

      const total = incidents.length;
      const responseMet = incidents.filter((i) => i.slaResponseMet === true).length;
      const resolutionMet = incidents.filter((i) => i.slaResolutionMet === true).length;

      result[priority] = {
        total,
        responseCompliance: total > 0 ? ((responseMet / total) * 100).toFixed(1) : "0",
        resolutionCompliance: total > 0 ? ((resolutionMet / total) * 100).toFixed(1) : "0",
      };
    }

    return result;
  }

  private async calculateDailyTrend(organizationId: string, startDate: Date) {
    const incidents = await this.prisma.incident.findMany({
      where: {
        organizationId,
        createdAt: { gte: startDate },
        slaResponseDue: { not: null },
      },
      select: {
        createdAt: true,
        slaResponseMet: true,
        slaResolutionMet: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Group by day
    const dailyData: Record<string, { total: number; responseMet: number; resolutionMet: number }> = {};

    for (const incident of incidents) {
      const date = incident.createdAt.toISOString().split("T")[0];
      if (!dailyData[date]) {
        dailyData[date] = { total: 0, responseMet: 0, resolutionMet: 0 };
      }
      dailyData[date].total++;
      if (incident.slaResponseMet) dailyData[date].responseMet++;
      if (incident.slaResolutionMet) dailyData[date].resolutionMet++;
    }

    return Object.entries(dailyData).map(([date, data]) => ({
      date,
      total: data.total,
      responseCompliance: data.total > 0 ? ((data.responseMet / data.total) * 100).toFixed(1) : "0",
      resolutionCompliance: data.total > 0 ? ((data.resolutionMet / data.total) * 100).toFixed(1) : "0",
    }));
  }

  async getBreachedSLAs(organizationId: string) {
    const now = new Date();

    const breached = await this.prisma.incident.findMany({
      where: {
        organizationId,
        OR: [
          {
            AND: [
              { slaResponseDue: { lt: now } },
              { slaResponseAt: null },
            ],
          },
          {
            AND: [
              { slaResolutionDue: { lt: now } },
              { resolvedAt: null },
            ],
          },
        ],
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { slaResponseDue: "asc" },
    });

    return breached.map((incident) => {
      const responseBreached = incident.slaResponseDue && new Date(incident.slaResponseDue) < now && !incident.slaResponseAt;
      const resolutionBreached = incident.slaResolutionDue && new Date(incident.slaResolutionDue) < now && !incident.resolvedAt;

      return {
        ...incident,
        breachType: responseBreached && resolutionBreached ? "both" : responseBreached ? "response" : "resolution",
        breachedAt: responseBreached ? incident.slaResponseDue : incident.slaResolutionDue,
        minutesOverdue: responseBreached
          ? Math.floor((now.getTime() - new Date(incident.slaResponseDue!).getTime()) / 60000)
          : Math.floor((now.getTime() - new Date(incident.slaResolutionDue!).getTime()) / 60000),
      };
    });
  }

  async getAtRiskSLAs(organizationId: string) {
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60 * 1000);

    const atRisk = await this.prisma.incident.findMany({
      where: {
        organizationId,
        OR: [
          {
            AND: [
              { slaResponseDue: { gt: now } },
              { slaResponseDue: { lt: thirtyMinutesFromNow } },
              { slaResponseAt: null },
            ],
          },
          {
            AND: [
              { slaResolutionDue: { gt: now } },
              { slaResolutionDue: { lt: thirtyMinutesFromNow } },
              { resolvedAt: null },
            ],
          },
        ],
      },
      include: {
        assignee: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
      orderBy: { slaResponseDue: "asc" },
    });

    return atRisk.map((incident) => {
      const responseAtRisk = incident.slaResponseDue && 
        new Date(incident.slaResponseDue) > now && 
        new Date(incident.slaResponseDue) < thirtyMinutesFromNow && 
        !incident.slaResponseAt;
      
      const resolutionAtRisk = incident.slaResolutionDue && 
        new Date(incident.slaResolutionDue) > now && 
        new Date(incident.slaResolutionDue) < thirtyMinutesFromNow && 
        !incident.resolvedAt;

      return {
        ...incident,
        riskType: responseAtRisk && resolutionAtRisk ? "both" : responseAtRisk ? "response" : "resolution",
        dueAt: responseAtRisk ? incident.slaResponseDue : incident.slaResolutionDue,
        minutesRemaining: responseAtRisk
          ? Math.floor((new Date(incident.slaResponseDue!).getTime() - now.getTime()) / 60000)
          : Math.floor((new Date(incident.slaResolutionDue!).getTime() - now.getTime()) / 60000),
      };
    });
  }

  async getSLATargets(organizationId: string) {
    const priorities = ["critical", "high", "medium", "low"];
    const policies = await this.prisma.sLAPolicy.findMany({
      where: { organizationId },
      orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
    });

    const byPriority = new Map<string, (typeof policies)[number]>();
    for (const policy of policies) {
      if (!byPriority.has(policy.priority)) {
        byPriority.set(policy.priority, policy);
      }
    }

    return priorities.map((priority) => {
      const policy = byPriority.get(priority);
      if (!policy) {
        return {
          priority,
          name: `${priority.toUpperCase()} SLA`,
          description: "",
          responseTimeMins: priority === "critical" ? 15 : priority === "high" ? 30 : priority === "medium" ? 60 : 120,
          resolutionTimeMins: priority === "critical" ? 120 : priority === "high" ? 240 : priority === "medium" ? 480 : 1440,
          businessHoursOnly: true,
          isActive: false,
        };
      }

      return {
        id: policy.id,
        priority: policy.priority,
        name: policy.name,
        description: policy.description,
        responseTimeMins: policy.responseTimeMins,
        resolutionTimeMins: policy.resolutionTimeMins,
        businessHoursOnly: policy.businessHoursOnly,
        isActive: policy.isActive,
      };
    });
  }

  async updateSLATargets(organizationId: string, targets: SLATargetDto[]) {
    await this.prisma.$transaction(async (tx) => {
      for (const target of targets) {
        const existing = await tx.sLAPolicy.findFirst({
          where: {
            organizationId,
            priority: target.priority,
          },
          orderBy: { createdAt: "asc" },
          select: { id: true },
        });

        if (existing) {
          await tx.sLAPolicy.update({
            where: { id: existing.id },
            data: {
              name: target.name || `${target.priority.toUpperCase()} SLA`,
              description: target.description || null,
              responseTimeMins: target.responseTimeMins,
              resolutionTimeMins: target.resolutionTimeMins,
              businessHoursOnly: target.businessHoursOnly ?? true,
              isActive: target.isActive ?? true,
            },
          });
        } else {
          await tx.sLAPolicy.create({
            data: {
              organizationId,
              priority: target.priority,
              name: target.name || `${target.priority.toUpperCase()} SLA`,
              description: target.description,
              responseTimeMins: target.responseTimeMins,
              resolutionTimeMins: target.resolutionTimeMins,
              businessHoursOnly: target.businessHoursOnly ?? true,
              isActive: target.isActive ?? true,
            },
          });
        }
      }
    });

    return this.getSLATargets(organizationId);
  }
}
