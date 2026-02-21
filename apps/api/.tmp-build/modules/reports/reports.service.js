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
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let ReportsService = class ReportsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getAvailableReports() {
        const now = Date.now();
        const oneDay = 24 * 60 * 60 * 1000;
        return [
            {
                id: "incident_summary",
                name: "Incident Summary",
                description: "Overview of incidents, status distribution, and priority mix",
                category: "Operations",
                lastRun: new Date(now - oneDay).toISOString(),
                status: "Ready",
            },
            {
                id: "sla_compliance",
                name: "SLA Compliance",
                description: "SLA response and resolution compliance metrics",
                category: "Operations",
                lastRun: new Date(now - 2 * oneDay).toISOString(),
                status: "Ready",
            },
            {
                id: "itil_kpi",
                name: "ITIL KPI",
                description: "MTTR, open backlog, closure rate, and transition health",
                category: "ITIL",
                lastRun: new Date(now - oneDay).toISOString(),
                status: "Ready",
            },
            {
                id: "incident_lifecycle",
                name: "Incident Lifecycle",
                description: "Lifecycle flow from new to closed with transition analytics",
                category: "ITIL",
                lastRun: new Date(now - 3 * oneDay).toISOString(),
                status: "Ready",
            },
            {
                id: "workflow_kpi",
                name: "Workflow KPI",
                description: "Workflow completion, step throughput, and task correlation",
                category: "Workflows",
                lastRun: new Date(now - 2 * oneDay).toISOString(),
                status: "Ready",
            },
            {
                id: "user_activity",
                name: "User Activity",
                description: "User activity and audit trail",
                category: "Security",
                lastRun: new Date(now - 3 * oneDay).toISOString(),
                status: "Ready",
            },
            {
                id: "audit_log",
                name: "Audit Log",
                description: "Complete audit log export with transition semantics",
                category: "Security",
                lastRun: new Date(now - oneDay).toISOString(),
                status: "Ready",
            },
        ];
    }
    async getReportJobs(organizationId, page = 1, limit = 20, filters) {
        const skip = (page - 1) * limit;
        const where = {
            organizationId,
            ...(filters?.status ? { status: filters.status } : {}),
            ...(filters?.type ? { type: filters.type } : {}),
            ...(filters?.format ? { format: filters.format } : {}),
        };
        const [jobs, total] = await Promise.all([
            this.prisma.reportJob.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    requestedBy: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                },
            }),
            this.prisma.reportJob.count({ where }),
        ]);
        return {
            data: jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async runReport(organizationId, userId, dto) {
        const parameters = this.normalizeParameters(dto.parameters);
        const isScheduled = dto.scheduleFrequency && dto.scheduleFrequency !== "none";
        const scheduleStartAt = dto.scheduleStartAt ? new Date(dto.scheduleStartAt) : null;
        if (isScheduled) {
            const job = await this.prisma.reportJob.create({
                data: {
                    type: dto.type,
                    format: dto.format || "json",
                    parameters: {
                        ...parameters,
                        schedule: {
                            frequency: dto.scheduleFrequency,
                            startAt: scheduleStartAt?.toISOString() || new Date().toISOString(),
                        },
                    },
                    organizationId,
                    requestedById: userId,
                    status: "scheduled",
                    startedAt: null,
                    completedAt: null,
                    downloadUrl: null,
                },
            });
            return {
                ...job,
                message: `Scheduled ${dto.type} report (${dto.scheduleFrequency})`,
            };
        }
        const dataset = await this.generateReportDataset(organizationId, dto.type, parameters);
        const job = await this.prisma.reportJob.create({
            data: {
                type: dto.type,
                format: dto.format || "json",
                parameters: parameters,
                organizationId,
                requestedById: userId,
                status: "completed",
                startedAt: new Date(),
                completedAt: new Date(),
                downloadUrl: `/api/reports/download/${dto.type}-${Date.now()}.${dto.format || "json"}`,
            },
        });
        return {
            ...job,
            dataset,
        };
    }
    async getReportJob(id, organizationId) {
        const job = await this.prisma.reportJob.findFirst({
            where: { id, organizationId },
            include: {
                requestedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
        if (!job) {
            return null;
        }
        if (job.status !== "completed") {
            return job;
        }
        const dataset = await this.generateReportDataset(organizationId, job.type, this.normalizeParameters(job.parameters));
        return {
            ...job,
            dataset,
        };
    }
    async generateReportDataset(organizationId, type, parameters) {
        switch (type) {
            case "incident_summary":
                return this.generateIncidentSummaryDataset(organizationId, parameters);
            case "sla_compliance":
                return this.generateSlaComplianceDataset(organizationId, parameters);
            case "itil_kpi":
                return this.generateItilKpiDataset(organizationId);
            case "incident_lifecycle":
                return this.generateIncidentLifecycleDataset(organizationId);
            case "workflow_kpi":
                return this.generateWorkflowKpiDataset(organizationId);
            case "user_activity":
                return this.generateUserActivityDataset(organizationId);
            case "audit_log":
                return this.generateAuditLogDataset(organizationId, parameters);
            default:
                return {
                    generatedAt: new Date().toISOString(),
                    organizationId,
                    details: "Unsupported report type",
                };
        }
    }
    async generateIncidentSummaryDataset(organizationId, parameters) {
        const fromDate = this.parseDate(parameters["fromDate"]);
        const toDate = this.parseDate(parameters["toDate"]);
        const dateFilter = {
            createdAt: {
                gte: fromDate || undefined,
                lte: toDate || undefined,
            },
        };
        const [byStatus, byPriority, total, openCount] = await Promise.all([
            this.prisma.incident.groupBy({
                by: ["status"],
                where: { organizationId, ...dateFilter },
                _count: { id: true },
            }),
            this.prisma.incident.groupBy({
                by: ["priority"],
                where: { organizationId, ...dateFilter },
                _count: { id: true },
            }),
            this.prisma.incident.count({ where: { organizationId, ...dateFilter } }),
            this.prisma.incident.count({
                where: {
                    organizationId,
                    ...dateFilter,
                    status: { in: ["new", "assigned", "in_progress", "pending", "escalated"] },
                },
            }),
        ]);
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            summary: {
                total,
                open: openCount,
                byStatus: byStatus.map((entry) => ({ status: entry.status, count: entry._count.id })),
                byPriority: byPriority.map((entry) => ({ priority: entry.priority, count: entry._count.id })),
            },
        };
    }
    async generateSlaComplianceDataset(organizationId, parameters) {
        const fromDate = this.parseDate(parameters["fromDate"]);
        const toDate = this.parseDate(parameters["toDate"]);
        const incidents = await this.prisma.incident.findMany({
            where: {
                organizationId,
                createdAt: {
                    gte: fromDate || undefined,
                    lte: toDate || undefined,
                },
            },
            select: {
                id: true,
                priority: true,
                createdAt: true,
                resolvedAt: true,
                slaResponseDue: true,
                slaResponseAt: true,
                slaResponseMet: true,
                slaResolutionDue: true,
                slaResolutionMet: true,
            },
        });
        const total = incidents.length;
        const responseMet = incidents.filter((incident) => incident.slaResponseMet === true).length;
        const resolutionMet = incidents.filter((incident) => incident.slaResolutionMet === true).length;
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            summary: {
                totalIncidents: total,
                responseComplianceRate: total ? Number(((responseMet / total) * 100).toFixed(2)) : 0,
                resolutionComplianceRate: total ? Number(((resolutionMet / total) * 100).toFixed(2)) : 0,
            },
            records: incidents,
        };
    }
    async generateItilKpiDataset(organizationId) {
        const incidents = await this.prisma.incident.findMany({
            where: { organizationId },
            select: {
                id: true,
                status: true,
                createdAt: true,
                resolvedAt: true,
                closedAt: true,
                slaResponseAt: true,
                slaResponseMet: true,
                slaResolutionMet: true,
            },
        });
        const openIncidents = incidents.filter((incident) => ["new", "assigned", "in_progress", "pending", "escalated"].includes(incident.status));
        const resolvedIncidents = incidents.filter((incident) => Boolean(incident.resolvedAt));
        const mttrMinutes = this.averageMinutes(resolvedIncidents
            .filter((incident) => incident.resolvedAt)
            .map((incident) => this.diffMinutes(incident.createdAt, incident.resolvedAt)));
        const mttaMinutes = this.averageMinutes(incidents
            .filter((incident) => incident.slaResponseAt)
            .map((incident) => this.diffMinutes(incident.createdAt, incident.slaResponseAt)));
        const transitionStats = await this.prisma.auditLog.groupBy({
            by: ["action"],
            where: {
                organizationId,
                action: { contains: "transition", mode: "insensitive" },
            },
            _count: { action: true },
        });
        const responseMet = incidents.filter((incident) => incident.slaResponseMet === true).length;
        const resolutionMet = incidents.filter((incident) => incident.slaResolutionMet === true).length;
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            summary: {
                totalIncidents: incidents.length,
                openIncidents: openIncidents.length,
                resolvedIncidents: resolvedIncidents.length,
                mttaMinutes,
                mttrMinutes,
                responseComplianceRate: incidents.length
                    ? Number(((responseMet / incidents.length) * 100).toFixed(2))
                    : 0,
                resolutionComplianceRate: incidents.length
                    ? Number(((resolutionMet / incidents.length) * 100).toFixed(2))
                    : 0,
            },
            transitionActivity: transitionStats.map((entry) => ({
                action: entry.action,
                count: entry._count.action,
            })),
        };
    }
    async generateIncidentLifecycleDataset(organizationId) {
        const [timelineTransitions, incidentsByStatus] = await Promise.all([
            this.prisma.incidentTimeline.findMany({
                where: {
                    incident: { organizationId },
                    action: { in: ["status_changed", "strict_transition"] },
                },
                select: {
                    incidentId: true,
                    action: true,
                    previousValue: true,
                    newValue: true,
                    createdAt: true,
                },
                orderBy: { createdAt: "desc" },
                take: 1000,
            }),
            this.prisma.incident.groupBy({
                by: ["status"],
                where: { organizationId },
                _count: { status: true },
            }),
        ]);
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            currentStatus: incidentsByStatus.map((entry) => ({
                status: entry.status,
                count: entry._count.status,
            })),
            transitions: timelineTransitions,
        };
    }
    async generateWorkflowKpiDataset(organizationId) {
        const [workflowTasks, workflowIdsFromTasks, workflowIdsFromIncidentLinks] = await Promise.all([
            this.prisma.task.groupBy({
                by: ["status"],
                where: {
                    organizationId,
                    OR: [{ workflowId: { not: null } }, { sourceEntityType: "workflow" }],
                },
                _count: { status: true },
            }),
            this.prisma.task.findMany({
                where: {
                    organizationId,
                    workflowId: { not: null },
                },
                select: { workflowId: true },
                distinct: ["workflowId"],
            }),
            this.prisma.workflow.findMany({
                where: { incident: { organizationId } },
                select: { id: true },
            }),
        ]);
        const workflowIds = Array.from(new Set([
            ...workflowIdsFromTasks.map((entry) => entry.workflowId).filter(Boolean),
            ...workflowIdsFromIncidentLinks.map((entry) => entry.id),
        ]));
        const workflows = workflowIds.length
            ? await this.prisma.workflow.findMany({
                where: { id: { in: workflowIds } },
                select: {
                    id: true,
                    status: true,
                    createdAt: true,
                    completedAt: true,
                },
            })
            : [];
        const workflowsByStatusMap = new Map();
        for (const workflow of workflows) {
            workflowsByStatusMap.set(workflow.status, (workflowsByStatusMap.get(workflow.status) || 0) + 1);
        }
        const workflowsByStatus = Array.from(workflowsByStatusMap.entries()).map(([status, count]) => ({ status, count }));
        const completed = workflows.filter((workflow) => workflow.status === "completed" && workflow.completedAt);
        const avgWorkflowMinutes = this.averageMinutes(completed.map((workflow) => this.diffMinutes(workflow.createdAt, workflow.completedAt)));
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            summary: {
                totalWorkflows: workflows.length,
                completedWorkflows: completed.length,
                avgWorkflowDurationMinutes: avgWorkflowMinutes,
            },
            workflowsByStatus,
            workflowTaskStatus: workflowTasks.map((entry) => ({
                status: entry.status,
                count: entry._count.status,
            })),
        };
    }
    async generateUserActivityDataset(organizationId) {
        const [users, activities] = await Promise.all([
            this.prisma.user.findMany({
                where: { organizationId },
                select: { id: true, firstName: true, lastName: true, createdAt: true },
                take: 250,
            }),
            this.prisma.activity.findMany({
                where: { organizationId },
                orderBy: { createdAt: "desc" },
                take: 500,
            }),
        ]);
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            summary: {
                totalUsers: users.length,
                activityEvents: activities.length,
            },
            users,
            recentActivity: activities,
        };
    }
    async generateAuditLogDataset(organizationId, parameters) {
        const fromDate = this.parseDate(parameters["fromDate"]);
        const toDate = this.parseDate(parameters["toDate"]);
        const [logs, transitions] = await Promise.all([
            this.prisma.auditLog.findMany({
                where: {
                    organizationId,
                    createdAt: {
                        gte: fromDate || undefined,
                        lte: toDate || undefined,
                    },
                },
                take: 10000,
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.auditLog.groupBy({
                by: ["action"],
                where: {
                    organizationId,
                    action: { contains: "transition", mode: "insensitive" },
                    createdAt: {
                        gte: fromDate || undefined,
                        lte: toDate || undefined,
                    },
                },
                _count: { action: true },
            }),
        ]);
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            totalLogs: logs.length,
            transitions: transitions.map((entry) => ({
                action: entry.action,
                count: entry._count.action,
            })),
            logs,
        };
    }
    normalizeParameters(parameters) {
        if (!parameters || typeof parameters !== "object") {
            return {};
        }
        return parameters;
    }
    parseDate(value) {
        if (typeof value !== "string" || !value) {
            return null;
        }
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
    }
    diffMinutes(start, end) {
        return Math.max(0, Math.round((end.getTime() - start.getTime()) / 60000));
    }
    averageMinutes(values) {
        if (values.length === 0) {
            return 0;
        }
        const total = values.reduce((sum, value) => sum + value, 0);
        return Number((total / values.length).toFixed(2));
    }
};
exports.ReportsService = ReportsService;
exports.ReportsService = ReportsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReportsService);
//# sourceMappingURL=reports.service.js.map