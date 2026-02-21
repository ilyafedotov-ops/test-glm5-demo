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
var SLADashboardService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLADashboardService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const sla_calculation_service_1 = require("../sla/sla-calculation.service");
let SLADashboardService = SLADashboardService_1 = class SLADashboardService {
    prisma;
    slaCalculation;
    logger = new common_1.Logger(SLADashboardService_1.name);
    constructor(prisma, slaCalculation) {
        this.prisma = prisma;
        this.slaCalculation = slaCalculation;
    }
    async getSLAMetrics(organizationId, period = "7d") {
        const days = parseInt(period.replace("d", "")) || 7;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
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
        const totalIncidents = incidents.length;
        const responseSLAMet = incidents.filter((i) => i.slaResponseMet === true).length;
        const resolutionSLAMet = incidents.filter((i) => i.slaResolutionMet === true).length;
        const responseSLACompliance = totalIncidents > 0
            ? ((responseSLAMet / totalIncidents) * 100).toFixed(1)
            : "0";
        const resolutionSLACompliance = totalIncidents > 0
            ? ((resolutionSLAMet / totalIncidents) * 100).toFixed(1)
            : "0";
        const breachedResponse = incidents.filter((i) => i.slaResponseDue && new Date() > new Date(i.slaResponseDue) && !i.slaResponseAt);
        const breachedResolution = incidents.filter((i) => i.slaResolutionDue && new Date() > new Date(i.slaResolutionDue) && !i.resolvedAt);
        const atRiskResponse = incidents.filter((i) => {
            if (!i.slaResponseDue || i.slaResponseAt)
                return false;
            const remaining = new Date(i.slaResponseDue).getTime() - new Date().getTime();
            return remaining > 0 && remaining < 30 * 60 * 1000;
        });
        const atRiskResolution = incidents.filter((i) => {
            if (!i.slaResolutionDue || i.resolvedAt)
                return false;
            const remaining = new Date(i.slaResolutionDue).getTime() - new Date().getTime();
            return remaining > 0 && remaining < 30 * 60 * 1000;
        });
        const slaByPriority = await this.calculateSLAByPriority(organizationId, startDate);
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
    async calculateSLAByPriority(organizationId, startDate) {
        const priorities = ["critical", "high", "medium", "low"];
        const result = {};
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
    async calculateDailyTrend(organizationId, startDate) {
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
        const dailyData = {};
        for (const incident of incidents) {
            const date = incident.createdAt.toISOString().split("T")[0];
            if (!dailyData[date]) {
                dailyData[date] = { total: 0, responseMet: 0, resolutionMet: 0 };
            }
            dailyData[date].total++;
            if (incident.slaResponseMet)
                dailyData[date].responseMet++;
            if (incident.slaResolutionMet)
                dailyData[date].resolutionMet++;
        }
        return Object.entries(dailyData).map(([date, data]) => ({
            date,
            total: data.total,
            responseCompliance: data.total > 0 ? ((data.responseMet / data.total) * 100).toFixed(1) : "0",
            resolutionCompliance: data.total > 0 ? ((data.resolutionMet / data.total) * 100).toFixed(1) : "0",
        }));
    }
    async getBreachedSLAs(organizationId) {
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
                    ? Math.floor((now.getTime() - new Date(incident.slaResponseDue).getTime()) / 60000)
                    : Math.floor((now.getTime() - new Date(incident.slaResolutionDue).getTime()) / 60000),
            };
        });
    }
    async getAtRiskSLAs(organizationId) {
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
                    ? Math.floor((new Date(incident.slaResponseDue).getTime() - now.getTime()) / 60000)
                    : Math.floor((new Date(incident.slaResolutionDue).getTime() - now.getTime()) / 60000),
            };
        });
    }
    async getSLATargets(organizationId) {
        const priorities = ["critical", "high", "medium", "low"];
        const policies = await this.prisma.sLAPolicy.findMany({
            where: { organizationId },
            orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
        });
        const byPriority = new Map();
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
    async updateSLATargets(organizationId, targets) {
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
                }
                else {
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
};
exports.SLADashboardService = SLADashboardService;
exports.SLADashboardService = SLADashboardService = SLADashboardService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        sla_calculation_service_1.SLACalculationService])
], SLADashboardService);
//# sourceMappingURL=sla-dashboard.service.js.map