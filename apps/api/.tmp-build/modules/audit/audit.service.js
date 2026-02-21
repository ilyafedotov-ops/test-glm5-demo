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
var AuditService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuditService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const system_links_1 = require("@/common/system-links/system-links");
let AuditService = AuditService_1 = class AuditService {
    prisma;
    logger = new common_1.Logger(AuditService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId, query) {
        const { page = 1, limit = 50, actorId, action, resource, resourceId, correlationId, caseType, transitionFrom, transitionTo, fromDate, toDate, search, } = query;
        const skip = (page - 1) * limit;
        const normalizedCaseType = caseType?.trim().toLowerCase();
        const normalizedTransitionFrom = transitionFrom?.trim().toLowerCase();
        const normalizedTransitionTo = transitionTo?.trim().toLowerCase();
        const createdAtFilter = {};
        if (fromDate) {
            createdAtFilter.gte = new Date(fromDate);
        }
        if (toDate) {
            createdAtFilter.lte = new Date(toDate);
        }
        const transitionSemanticsRequested = Boolean(normalizedCaseType || normalizedTransitionFrom || normalizedTransitionTo);
        const andClauses = [];
        if (normalizedCaseType) {
            andClauses.push({
                OR: [
                    { resource: { contains: normalizedCaseType, mode: "insensitive" } },
                    { action: { contains: normalizedCaseType, mode: "insensitive" } },
                ],
            });
        }
        if (search) {
            andClauses.push({
                OR: [
                    { action: { contains: search, mode: "insensitive" } },
                    { resource: { contains: search, mode: "insensitive" } },
                ],
            });
        }
        if (normalizedTransitionFrom || normalizedTransitionTo) {
            andClauses.push({
                action: { contains: "transition", mode: "insensitive" },
            });
        }
        const where = {
            organizationId,
            ...(actorId && { actorId }),
            ...(action && { action: { contains: action, mode: "insensitive" } }),
            ...(resource && { resource: { contains: resource, mode: "insensitive" } }),
            ...(resourceId && { resourceId }),
            ...(correlationId && { correlationId }),
            ...(Object.keys(createdAtFilter).length > 0 && { createdAt: createdAtFilter }),
            ...(andClauses.length > 0 && { AND: andClauses }),
        };
        let logs = [];
        let total = 0;
        if (transitionSemanticsRequested) {
            const coarseLogs = await this.prisma.auditLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: 5000,
                include: {
                    actor: {
                        select: { firstName: true, lastName: true },
                    },
                },
            });
            const filteredLogs = coarseLogs.filter((log) => this.matchesSemanticFilters(log, normalizedCaseType, normalizedTransitionFrom, normalizedTransitionTo));
            total = filteredLogs.length;
            logs = filteredLogs.slice(skip, skip + limit);
        }
        else {
            const [pagedLogs, rawTotal] = await Promise.all([
                this.prisma.auditLog.findMany({
                    where,
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                    include: {
                        actor: {
                            select: { firstName: true, lastName: true },
                        },
                    },
                }),
                this.prisma.auditLog.count({ where }),
            ]);
            logs = pagedLogs;
            total = rawTotal;
        }
        return {
            data: logs.map((log) => this.toEntity(log)),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    matchesSemanticFilters(log, caseType, transitionFrom, transitionTo) {
        if (caseType) {
            const resource = (log.resource || "").toLowerCase();
            const action = (log.action || "").toLowerCase();
            const metadataCaseType = this.asNormalizedString(this.readObjectField(log.metadata, "caseType"));
            if (resource !== caseType &&
                !resource.includes(caseType) &&
                !action.includes(caseType) &&
                metadataCaseType !== caseType) {
                return false;
            }
        }
        if (transitionFrom) {
            const metaFrom = this.asNormalizedString(this.readObjectField(log.metadata, "transitionFrom"));
            const prevFrom = this.asNormalizedString(this.readObjectField(log.previousValue, "status"));
            if (metaFrom !== transitionFrom && prevFrom !== transitionFrom) {
                return false;
            }
        }
        if (transitionTo) {
            const metaTo = this.asNormalizedString(this.readObjectField(log.metadata, "transitionTo"));
            const nextTo = this.asNormalizedString(this.readObjectField(log.newValue, "status"));
            if (metaTo !== transitionTo && nextTo !== transitionTo) {
                return false;
            }
        }
        return true;
    }
    asNormalizedString(value) {
        if (typeof value !== "string") {
            return undefined;
        }
        const trimmed = value.trim().toLowerCase();
        return trimmed.length > 0 ? trimmed : undefined;
    }
    readObjectField(value, key) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return undefined;
        }
        return value[key];
    }
    async findOne(id, organizationId) {
        const log = await this.prisma.auditLog.findFirst({
            where: { id, organizationId },
            include: {
                actor: {
                    select: { firstName: true, lastName: true },
                },
            },
        });
        if (!log) {
            throw new common_1.NotFoundException(`Audit log ${id} not found`);
        }
        const entity = this.toEntity(log);
        const diffs = this.computeDiffs(log.previousValue, log.newValue);
        return {
            ...entity,
            diffs,
        };
    }
    async getStats(organizationId) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const [totalLogs, todayCount, actionGroups, resourceGroups, actorGroups] = await Promise.all([
            this.prisma.auditLog.count({ where: { organizationId } }),
            this.prisma.auditLog.count({
                where: { organizationId, createdAt: { gte: today } },
            }),
            this.prisma.auditLog.groupBy({
                by: ["action"],
                where: { organizationId },
                _count: { action: true },
                orderBy: { _count: { action: "desc" } },
                take: 10,
            }),
            this.prisma.auditLog.groupBy({
                by: ["resource"],
                where: { organizationId },
                _count: { resource: true },
                orderBy: { _count: { resource: "desc" } },
                take: 10,
            }),
            this.prisma.auditLog.groupBy({
                by: ["actorId"],
                where: { organizationId, actorId: { not: null } },
                _count: { actorId: true },
                orderBy: { _count: { actorId: "desc" } },
                take: 10,
            }),
        ]);
        const actorIds = actorGroups.map((g) => g.actorId).filter(Boolean);
        const actors = await this.prisma.user.findMany({
            where: { id: { in: actorIds } },
            select: { id: true, firstName: true, lastName: true },
        });
        const actorMap = new Map(actors.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));
        return {
            totalLogs,
            todayCount,
            topActions: actionGroups.map((g) => ({ action: g.action, count: g._count.action })),
            topResources: resourceGroups.map((g) => ({ resource: g.resource, count: g._count.resource })),
            topActors: actorGroups.map((g) => ({
                actorId: g.actorId || "unknown",
                actorName: actorMap.get(g.actorId) || "System",
                count: g._count.actorId,
            })),
        };
    }
    async exportLogs(organizationId, query) {
        const { data } = await this.findAll(organizationId, { ...query, limit: 10000 });
        return data;
    }
    computeDiffs(previousValue, newValue) {
        const diffs = [];
        if (!previousValue && !newValue) {
            return diffs;
        }
        if (!previousValue && newValue) {
            for (const [field, value] of Object.entries(newValue)) {
                diffs.push({ field, newValue: value, changeType: "added" });
            }
            return diffs;
        }
        if (previousValue && !newValue) {
            for (const [field, value] of Object.entries(previousValue)) {
                diffs.push({ field, oldValue: value, changeType: "removed" });
            }
            return diffs;
        }
        const allFields = new Set([
            ...Object.keys(previousValue),
            ...Object.keys(newValue),
        ]);
        for (const field of allFields) {
            const oldVal = previousValue[field];
            const newVal = newValue[field];
            if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
                if (oldVal === undefined) {
                    diffs.push({ field, newValue: newVal, changeType: "added" });
                }
                else if (newVal === undefined) {
                    diffs.push({ field, oldValue: oldVal, changeType: "removed" });
                }
                else {
                    diffs.push({
                        field,
                        oldValue: oldVal,
                        newValue: newVal,
                        changeType: "modified",
                    });
                }
            }
        }
        return diffs;
    }
    toEntity(log) {
        const systemRecordId = (0, system_links_1.toSystemRecordId)("audit_log", log.id);
        const resourceType = typeof log.resource === "string" && log.resource.trim().length > 0
            ? log.resource.trim().toLowerCase().replace(/\s+/g, "_")
            : "entity";
        return {
            id: log.id,
            actorId: log.actorId,
            actorType: log.actorType,
            actorName: log.actor
                ? `${log.actor.firstName} ${log.actor.lastName}`
                : undefined,
            action: log.action,
            resource: log.resource,
            resourceId: log.resourceId,
            previousValue: log.previousValue,
            newValue: log.newValue,
            metadata: log.metadata,
            ipAddress: log.ipAddress,
            userAgent: log.userAgent,
            correlationId: log.correlationId,
            organizationId: log.organizationId,
            createdAt: log.createdAt,
            systemRecordId,
            traceContext: (0, system_links_1.toTraceContext)(systemRecordId, log.metadata, { correlationId: log.correlationId }),
            relatedRecords: (0, system_links_1.buildRelatedRecords)([
                { type: resourceType, id: log.resourceId, relationship: "audit_target" },
            ]),
        };
    }
};
exports.AuditService = AuditService;
exports.AuditService = AuditService = AuditService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AuditService);
//# sourceMappingURL=audit.service.js.map