import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { toSystemRecordId } from "@/common/system-links/system-links";

@Injectable()
export class DashboardService {
  constructor(private prisma: PrismaService) {}

  async getSummary(organizationId: string) {
    const [
      totalIncidents,
      openIncidents,
      criticalIncidents,
      incidentsByStatus,
      incidentsByPriority,
      recentIncidents,
      riskSummary,
    ] = await Promise.all([
      this.prisma.incident.count({ where: { organizationId } }),
      this.prisma.incident.count({
        where: { organizationId, status: { in: ["open", "in_progress"] } },
      }),
      this.prisma.incident.count({
        where: { organizationId, priority: "critical", status: { not: "closed" } },
      }),
      this.getIncidentsByStatus(organizationId),
      this.getIncidentsByPriority(organizationId),
      this.getRecentIncidents(organizationId),
      this.getRiskSummary(organizationId),
    ]);

    const resolvedIncidents = await this.prisma.incident.findMany({
      where: {
        organizationId,
        resolvedAt: { not: null },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true, resolvedAt: true },
    });

    const avgResolutionTime =
      resolvedIncidents.length > 0
        ? resolvedIncidents.reduce((sum, i) => {
            const diff =
              (i.resolvedAt!.getTime() - i.createdAt.getTime()) /
              (1000 * 60 * 60);
            return sum + diff;
          }, 0) / resolvedIncidents.length
        : 0;

    const slaCompliant = await this.prisma.incident.count({
      where: {
        organizationId,
        OR: [
          { dueAt: null },
          { status: "closed" },
        ],
      },
    });
    const slaCompliancePercent =
      totalIncidents > 0
        ? Math.round((slaCompliant / totalIncidents) * 100)
        : 100;

    const trendData = await this.getTrendData(organizationId);
    const correlationMap = await this.getCorrelationMap(organizationId);
    const slaTargets = await this.getSLATargets(organizationId);

    return {
      totalIncidents,
      openIncidents,
      criticalIncidents,
      avgResolutionTimeHours: Math.round(avgResolutionTime * 10) / 10,
      slaCompliancePercent,
      incidentsByStatus,
      incidentsByPriority,
      trendData,
      recentIncidents,
      majorIncidentSummary: riskSummary.majorIncidentSummary,
      topRiskServices: riskSummary.topRiskServices,
      crossDomain: correlationMap.crossDomain,
      recentActivity: correlationMap.recentActivity,
      slaTargets,
    };
  }

  async getRiskSummary(organizationId: string) {
    const now = new Date();
    const atRiskThreshold = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    const activeStatuses = ["new", "assigned", "in_progress", "pending", "escalated"];

    const [majorIncidents, openIncidents] = await Promise.all([
      this.prisma.incident.findMany({
        where: {
          organizationId,
          tags: { has: "major" },
          status: { in: activeStatuses },
        },
        include: {
          assignee: {
            select: { firstName: true, lastName: true },
          },
          configurationItems: {
            include: {
              configurationItem: {
                select: { name: true, type: true },
              },
            },
          },
        },
        orderBy: [{ priority: "asc" }, { updatedAt: "desc" }],
        take: 8,
      }),
      this.prisma.incident.findMany({
        where: {
          organizationId,
          status: { in: activeStatuses },
        },
        include: {
          configurationItems: {
            include: {
              configurationItem: {
                select: {
                  name: true,
                  type: true,
                  ownerTeam: true,
                  criticality: true,
                },
              },
            },
          },
        },
      }),
    ]);

    type ServiceRiskAccumulator = {
      name: string;
      ownerTeam?: string | null;
      openIncidents: number;
      majorIncidents: number;
      atRiskIncidents: number;
      breachedIncidents: number;
      weightedPriority: number;
      criticalityWeight: number;
    };

    const riskByService = new Map<string, ServiceRiskAccumulator>();

    for (const incident of openIncidents) {
      const isMajor = incident.tags.includes("major");
      const isBreached = !!incident.slaResolutionDue && incident.slaResolutionDue < now;
      const isAtRisk =
        !!incident.slaResolutionDue &&
        incident.slaResolutionDue >= now &&
        incident.slaResolutionDue <= atRiskThreshold;
      const priorityWeight = this.getPriorityWeight(incident.priority);

      const services =
        incident.configurationItems
          .map((link) => link.configurationItem)
          .filter((ci) => ci.type === "service" || ci.type === "application");

      const linkedServices = services.length > 0
        ? services
        : [{ name: "Unmapped service", ownerTeam: null, criticality: "medium" }];

      for (const service of linkedServices) {
        const key = service.name.trim() || "Unmapped service";
        const existing = riskByService.get(key) || {
          name: key,
          ownerTeam: service.ownerTeam,
          openIncidents: 0,
          majorIncidents: 0,
          atRiskIncidents: 0,
          breachedIncidents: 0,
          weightedPriority: 0,
          criticalityWeight: this.getCriticalityWeight(service.criticality || "medium"),
        };

        existing.openIncidents += 1;
        existing.majorIncidents += isMajor ? 1 : 0;
        existing.atRiskIncidents += isAtRisk ? 1 : 0;
        existing.breachedIncidents += isBreached ? 1 : 0;
        existing.weightedPriority += priorityWeight;
        if (!existing.ownerTeam && service.ownerTeam) {
          existing.ownerTeam = service.ownerTeam;
        }
        riskByService.set(key, existing);
      }
    }

    const topRiskServices = Array.from(riskByService.values())
      .map((service) => {
        const riskScore = Math.min(
          100,
          Math.round(
            service.openIncidents * 10 +
              service.majorIncidents * 25 +
              service.atRiskIncidents * 16 +
              service.breachedIncidents * 22 +
              service.weightedPriority +
              service.criticalityWeight
          )
        );

        return {
          name: service.name,
          ownerTeam: service.ownerTeam || "Unassigned",
          openIncidents: service.openIncidents,
          majorIncidents: service.majorIncidents,
          atRiskIncidents: service.atRiskIncidents,
          breachedIncidents: service.breachedIncidents,
          riskScore,
        };
      })
      .sort((a, b) => b.riskScore - a.riskScore || b.openIncidents - a.openIncidents)
      .slice(0, 5);

    return {
      majorIncidentSummary: {
        activeCount: majorIncidents.length,
        incidents: majorIncidents.map((incident) => {
          const affectedServices = incident.configurationItems
            .map((link) => link.configurationItem?.name)
            .filter((name): name is string => !!name)
            .slice(0, 4);
          return {
            id: incident.id,
            title: incident.title,
            ticketNumber: incident.ticketNumber,
            priority: incident.priority,
            status: incident.status,
            commander: incident.assignee
              ? `${incident.assignee.firstName} ${incident.assignee.lastName}`.trim()
              : "Unassigned",
            bridgeStatus: this.getBridgeStatus(incident.status),
            affectedServices,
          };
        }),
      },
      topRiskServices,
    };
  }

  private async getSLATargets(organizationId: string) {
    const policies = await this.prisma.sLAPolicy.findMany({
      where: { organizationId, isActive: true },
      select: { priority: true, responseTimeMins: true, resolutionTimeMins: true },
      orderBy: { priority: "asc" },
    });
    return policies.map((p) => ({
      priority: p.priority,
      responseTimeMins: p.responseTimeMins,
      resolutionTimeMins: p.resolutionTimeMins,
    }));
  }

  async getCorrelationMap(organizationId: string) {
    const [
      totalTasks,
      linkedTasks,
      totalViolations,
      totalWorkflows,
      auditLogsLast7Days,
      recentActivity,
    ] = await Promise.all([
      this.prisma.task.count({ where: { organizationId } }),
      this.prisma.task.count({
        where: {
          organizationId,
          OR: [
            { incidentId: { not: null } },
            { workflowId: { not: null } },
            { violationId: { not: null } },
            { policyId: { not: null } },
            { sourceEntityId: { not: null } },
          ],
        },
      }),
      this.prisma.violation.count({ where: { organizationId } }),
      this.prisma.workflow.count({
        where: {
          incident: {
            organizationId,
          },
        },
      }),
      this.prisma.auditLog.count({
        where: {
          organizationId,
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.getRecentCrossDomainActivity(organizationId),
    ]);

    const linkageCoveragePercent =
      totalTasks > 0
        ? Math.round((linkedTasks / totalTasks) * 100)
        : 100;

    return {
      crossDomain: {
        tasks: totalTasks,
        workflows: totalWorkflows,
        violations: totalViolations,
        auditLogsLast7Days,
        linkageCoveragePercent,
      },
      recentActivity,
    };
  }

  private async getIncidentsByStatus(organizationId: string) {
    const statuses = [
      "open",
      "in_progress",
      "pending",
      "resolved",
      "closed",
      "escalated",
    ];
    const result: Record<string, number> = {};

    for (const status of statuses) {
      result[status] = await this.prisma.incident.count({
        where: { organizationId, status },
      });
    }

    return result;
  }

  private async getIncidentsByPriority(organizationId: string) {
    const priorities = ["critical", "high", "medium", "low"];
    const result: Record<string, number> = {};

    for (const priority of priorities) {
      result[priority] = await this.prisma.incident.count({
        where: { organizationId, priority },
      });
    }

    return result;
  }

  private async getTrendData(organizationId: string) {
    const days = 14;
    const result = [];

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const created = await this.prisma.incident.count({
        where: {
          organizationId,
          createdAt: { gte: date, lt: nextDate },
        },
      });

      const resolved = await this.prisma.incident.count({
        where: {
          organizationId,
          resolvedAt: { gte: date, lt: nextDate },
        },
      });

      result.push({
        date: date.toISOString().split("T")[0],
        created,
        resolved,
      });
    }

    return result;
  }

  private async getRecentIncidents(organizationId: string) {
    return this.prisma.incident.findMany({
      where: { organizationId, status: { not: "closed" } },
      take: 5,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        priority: true,
        status: true,
        dueAt: true,
      },
    });
  }

  private async getRecentCrossDomainActivity(organizationId: string) {
    const activities = await this.prisma.activity.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        entityType: true,
        entityId: true,
        action: true,
        title: true,
        description: true,
        createdAt: true,
      },
    });

    return activities.map((activity) => ({
      id: activity.id,
      entityType: activity.entityType,
      entityId: activity.entityId,
      systemRecordId: toSystemRecordId(activity.entityType, activity.entityId),
      action: activity.action,
      title: activity.title,
      description: activity.description,
      createdAt: activity.createdAt,
    }));
  }

  private getBridgeStatus(status: string): "active" | "standby" | "resolved" {
    if (status === "in_progress" || status === "escalated") {
      return "active";
    }

    if (status === "resolved" || status === "closed") {
      return "resolved";
    }

    return "standby";
  }

  private getPriorityWeight(priority: string): number {
    switch (priority?.toLowerCase()) {
      case "critical":
        return 15;
      case "high":
        return 10;
      case "medium":
        return 6;
      case "low":
        return 3;
      default:
        return 5;
    }
  }

  private getCriticalityWeight(criticality: string): number {
    switch (criticality?.toLowerCase()) {
      case "critical":
        return 12;
      case "high":
        return 8;
      case "medium":
        return 4;
      case "low":
        return 2;
      default:
        return 4;
    }
  }
}
