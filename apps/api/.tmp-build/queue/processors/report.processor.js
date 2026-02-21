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
var ReportProcessor_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportProcessor = void 0;
const common_1 = require("@nestjs/common");
const queue_service_1 = require("../queue.service");
const queue_constants_1 = require("../queue.constants");
const prisma_service_1 = require("@/prisma/prisma.service");
let ReportProcessor = ReportProcessor_1 = class ReportProcessor {
    queueService;
    prisma;
    logger = new common_1.Logger(ReportProcessor_1.name);
    constructor(queueService, prisma) {
        this.queueService = queueService;
        this.prisma = prisma;
    }
    onModuleInit() {
        this.queueService.registerWorker(queue_constants_1.QUEUE_NAMES.REPORTS, this.process.bind(this));
        this.logger.log("Report processor registered");
    }
    async process(job) {
        this.logger.log(`Processing report job: ${job.id}`);
        const { jobId, type, format, organizationId, parameters } = job.data;
        try {
            await this.prisma.reportJob.update({
                where: { id: jobId },
                data: { status: "processing", startedAt: new Date() },
            });
            await job.updateProgress(10);
            let reportData;
            switch (type) {
                case "incident_summary":
                    reportData = await this.generateIncidentSummary(organizationId, parameters);
                    break;
                case "sla_compliance":
                    reportData = await this.generateSLACompliance(organizationId, parameters);
                    break;
                case "user_activity":
                    reportData = await this.generateUserActivity(organizationId, parameters);
                    break;
                case "audit_log":
                    reportData = await this.generateAuditLog(organizationId, parameters);
                    break;
                case "itil_kpi":
                    reportData = await this.generateItilKpi(organizationId, parameters);
                    break;
                case "incident_lifecycle":
                    reportData = await this.generateIncidentLifecycle(organizationId, parameters);
                    break;
                case "workflow_kpi":
                    reportData = await this.generateWorkflowKpi(organizationId, parameters);
                    break;
                default:
                    throw new Error(`Unknown report type: ${type}`);
            }
            await job.updateProgress(50);
            const content = format === "json"
                ? JSON.stringify(reportData, null, 2)
                : this.convertToCSV(reportData);
            await job.updateProgress(80);
            const downloadUrl = `https://storage.example.com/reports/${jobId}.${format}`;
            await this.prisma.reportJob.update({
                where: { id: jobId },
                data: {
                    status: "completed",
                    completedAt: new Date(),
                    downloadUrl,
                },
            });
            await job.updateProgress(100);
            this.logger.log(`Report job completed: ${job.id}`);
            return { success: true, downloadUrl };
        }
        catch (error) {
            await this.prisma.reportJob.update({
                where: { id: jobId },
                data: {
                    status: "failed",
                    error: error.message,
                },
            });
            this.logger.error(`Report job failed: ${job.id} - ${error.message}`);
            throw error;
        }
    }
    async generateIncidentSummary(organizationId, params) {
        const incidents = await this.prisma.incident.groupBy({
            by: ["status", "priority"],
            where: { organizationId },
            _count: { id: true },
        });
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            summary: incidents,
            totalIncidents: incidents.reduce((sum, i) => sum + i._count.id, 0),
        };
    }
    async generateSLACompliance(organizationId, params) {
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            compliance: {
                onTime: 85,
                breached: 15,
                averageResolutionTime: "4.5 hours",
            },
        };
    }
    async generateUserActivity(organizationId, params) {
        const users = await this.prisma.user.findMany({
            where: { organizationId },
            select: { id: true, firstName: true, lastName: true, createdAt: true },
            take: 100,
        });
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            users,
            totalUsers: users.length,
        };
    }
    async generateAuditLog(organizationId, params) {
        const logs = await this.prisma.auditLog.findMany({
            where: {
                organizationId,
                createdAt: {
                    gte: params.fromDate ? new Date(params.fromDate) : undefined,
                    lte: params.toDate ? new Date(params.toDate) : undefined,
                },
            },
            take: 10000,
            orderBy: { createdAt: "desc" },
        });
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            totalLogs: logs.length,
            logs,
        };
    }
    async generateItilKpi(organizationId, params) {
        const incidents = await this.prisma.incident.findMany({
            where: { organizationId },
            select: {
                id: true,
                status: true,
                createdAt: true,
                resolvedAt: true,
                slaResponseAt: true,
                slaResponseMet: true,
                slaResolutionMet: true,
            },
        });
        const mttrValues = incidents
            .filter((incident) => incident.resolvedAt)
            .map((incident) => Math.max(0, Math.round((incident.resolvedAt.getTime() - incident.createdAt.getTime()) / 60000)));
        const mttaValues = incidents
            .filter((incident) => incident.slaResponseAt)
            .map((incident) => Math.max(0, Math.round((incident.slaResponseAt.getTime() - incident.createdAt.getTime()) / 60000)));
        const mttr = mttrValues.length > 0
            ? Number((mttrValues.reduce((sum, value) => sum + value, 0) / mttrValues.length).toFixed(2))
            : 0;
        const mtta = mttaValues.length > 0
            ? Number((mttaValues.reduce((sum, value) => sum + value, 0) / mttaValues.length).toFixed(2))
            : 0;
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            summary: {
                totalIncidents: incidents.length,
                openIncidents: incidents.filter((incident) => ["new", "assigned", "in_progress", "pending", "escalated"].includes(incident.status)).length,
                mttrMinutes: mttr,
                mttaMinutes: mtta,
                responseComplianceRate: incidents.length
                    ? Number(((incidents.filter((incident) => incident.slaResponseMet === true).length /
                        incidents.length) *
                        100).toFixed(2))
                    : 0,
                resolutionComplianceRate: incidents.length
                    ? Number(((incidents.filter((incident) => incident.slaResolutionMet === true).length /
                        incidents.length) *
                        100).toFixed(2))
                    : 0,
            },
        };
    }
    async generateIncidentLifecycle(organizationId, params) {
        const transitions = await this.prisma.incidentTimeline.findMany({
            where: {
                incident: { organizationId },
                action: { in: ["status_changed", "strict_transition"] },
            },
            orderBy: { createdAt: "desc" },
            take: 1000,
        });
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            totalTransitions: transitions.length,
            transitions,
        };
    }
    async generateWorkflowKpi(organizationId, params) {
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
                select: { id: true, status: true, createdAt: true, completedAt: true },
                take: 1000,
            })
            : [];
        return {
            generatedAt: new Date().toISOString(),
            organizationId,
            summary: {
                totalWorkflows: workflows.length,
                completedWorkflows: workflows.filter((workflow) => workflow.status === "completed")
                    .length,
            },
            workflowTaskStatus: workflowTasks.map((entry) => ({
                status: entry.status,
                count: entry._count.status,
            })),
        };
    }
    convertToCSV(data) {
        if (Array.isArray(data.logs)) {
            const headers = Object.keys(data.logs[0] || {});
            const rows = data.logs.map((log) => headers.map((h) => JSON.stringify(log[h] ?? "")).join(","));
            return [headers.join(","), ...rows].join("\n");
        }
        return JSON.stringify(data);
    }
};
exports.ReportProcessor = ReportProcessor;
exports.ReportProcessor = ReportProcessor = ReportProcessor_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [queue_service_1.QueueService,
        prisma_service_1.PrismaService])
], ReportProcessor);
//# sourceMappingURL=report.processor.js.map