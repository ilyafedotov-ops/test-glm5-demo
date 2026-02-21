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
var IncidentsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
const tickets_service_1 = require("../tickets/tickets.service");
const priority_matrix_service_1 = require("../sla/priority-matrix.service");
const sla_calculation_service_1 = require("../sla/sla-calculation.service");
const activities_service_1 = require("../activities/activities.service");
const workflows_service_1 = require("../workflows/workflows.service");
const configuration_items_service_1 = require("../configuration-items/configuration-items.service");
let IncidentsService = IncidentsService_1 = class IncidentsService {
    prisma;
    ticketsService;
    priorityMatrix;
    slaCalculation;
    activitiesService;
    workflowsService;
    configurationItemsService;
    logger = new common_1.Logger(IncidentsService_1.name);
    strictTransitionMap = {
        new: ["assigned", "in_progress", "cancelled", "escalated"],
        assigned: ["in_progress", "pending", "resolved", "cancelled", "escalated"],
        in_progress: ["pending", "resolved", "cancelled", "escalated"],
        pending: ["in_progress", "resolved", "cancelled", "escalated"],
        escalated: ["assigned", "in_progress", "pending", "resolved", "cancelled"],
        resolved: ["closed", "in_progress"],
        closed: [],
        cancelled: [],
    };
    constructor(prisma, ticketsService, priorityMatrix, slaCalculation, activitiesService, workflowsService, configurationItemsService) {
        this.prisma = prisma;
        this.ticketsService = ticketsService;
        this.priorityMatrix = priorityMatrix;
        this.slaCalculation = slaCalculation;
        this.activitiesService = activitiesService;
        this.workflowsService = workflowsService;
        this.configurationItemsService = configurationItemsService;
    }
    async create(organizationId, reporterId, dto) {
        const ticketNumber = await this.ticketsService.generateTicketNumber(organizationId, "incident");
        let priority = dto.priority || "medium";
        if (dto.impact && dto.urgency) {
            priority = this.priorityMatrix.calculatePriority(dto.impact, dto.urgency);
        }
        const slaDeadlines = await this.slaCalculation.calculateIncidentSLA(organizationId, priority);
        const slaPolicy = await this.prisma.sLAPolicy.findFirst({
            where: { organizationId, priority: priority.toLowerCase(), isActive: true },
        });
        const configurationItemIds = await this.configurationItemsService.validateConfigurationItemIds(organizationId, dto.configurationItemIds || []);
        const incident = await this.prisma.incident.create({
            data: {
                ticketNumber,
                title: dto.title,
                description: dto.description,
                status: "new",
                priority,
                organizationId,
                reporterId,
                teamId: dto.teamId,
                assigneeId: dto.assigneeId,
                categoryId: dto.categoryId,
                impact: dto.impact || "medium",
                urgency: dto.urgency || "medium",
                channel: dto.channel || "portal",
                tags: [...(dto.tags || []), ...(dto.isMajorIncident ? ["major"] : [])],
                dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
                problemId: dto.problemId,
                slaPolicyId: slaPolicy?.id,
                slaResponseDue: slaDeadlines.responseDue,
                slaResolutionDue: slaDeadlines.resolutionDue,
                ...(configurationItemIds.length > 0
                    ? {
                        configurationItems: {
                            create: configurationItemIds.map((configurationItemId) => ({
                                configurationItem: { connect: { id: configurationItemId } },
                            })),
                        },
                    }
                    : {}),
            },
            include: {
                reporter: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                team: true,
                category: true,
                slaPolicy: true,
                configurationItems: {
                    include: {
                        configurationItem: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                status: true,
                                criticality: true,
                                environment: true,
                            },
                        },
                    },
                },
            },
        });
        await this.createTimelineEntry(incident.id, "created", undefined, incident.status, reporterId, { caseType: "incident" });
        await this.activitiesService.create({
            organizationId,
            entityType: "incident",
            entityId: incident.id,
            action: "created",
            actorId: reporterId,
            title: `Incident ${ticketNumber} created: ${incident.title}`,
            description: dto.description,
            metadata: { priority, impact: dto.impact, urgency: dto.urgency },
        });
        try {
            const workflow = await this.workflowsService.autoAssignIncidentWorkflowTemplate(organizationId, reporterId, {
                id: incident.id,
                title: incident.title,
                ticketNumber: incident.ticketNumber,
                priority: incident.priority,
                status: incident.status,
                channel: incident.channel,
                categoryId: incident.categoryId,
                assigneeId: incident.assigneeId,
                teamId: incident.teamId,
            });
            if (workflow) {
                await this.createTimelineEntry(incident.id, "workflow_auto_assigned", undefined, workflow.id, reporterId, this.cleanMetadata({
                    caseType: "incident",
                    workflowId: workflow.id,
                    workflowTemplateId: workflow.context?.templateId,
                }));
            }
        }
        catch (error) {
            this.logger.error(`Failed to auto-assign workflow for incident ${incident.id}: ${error instanceof Error ? error.message : String(error)}`);
        }
        this.logger.log(`Incident created: ${ticketNumber} by user ${reporterId}`);
        return this.toIncidentResponse(incident);
    }
    async findAll(organizationId, query) {
        const { page = 1, limit = 20, status, priority, channel, impact, urgency, categoryId, slaState, ticketNumber, assigneeId, teamId, search, isMajorIncident, } = query;
        const skip = (page - 1) * limit;
        const now = new Date();
        const atRiskThreshold = new Date(now.getTime() + 60 * 60000);
        const where = { organizationId };
        if (status) {
            where["status"] = Array.isArray(status) ? { in: status } : status;
        }
        if (priority) {
            where["priority"] = Array.isArray(priority) ? { in: priority } : priority;
        }
        if (channel) {
            where["channel"] = channel;
        }
        if (impact) {
            where["impact"] = impact;
        }
        if (urgency) {
            where["urgency"] = urgency;
        }
        if (categoryId) {
            where["categoryId"] = categoryId;
        }
        if (assigneeId) {
            where["assigneeId"] = assigneeId;
        }
        if (teamId) {
            where["teamId"] = teamId;
        }
        if (ticketNumber) {
            where["ticketNumber"] = { contains: ticketNumber, mode: "insensitive" };
        }
        if (isMajorIncident === true) {
            where["tags"] = { has: "major" };
        }
        const andClauses = [];
        if (slaState === "breached") {
            andClauses.push({
                OR: [
                    { slaResponseMet: false },
                    { slaResolutionMet: false },
                    {
                        AND: [
                            { status: { notIn: ["resolved", "closed", "cancelled"] } },
                            { slaResolutionDue: { lt: now } },
                        ],
                    },
                ],
            });
        }
        else if (slaState === "at_risk") {
            andClauses.push({ status: { notIn: ["resolved", "closed", "cancelled"] } }, { slaResolutionDue: { gte: now, lte: atRiskThreshold } }, { slaResolutionMet: { not: false } });
        }
        else if (slaState === "on_track") {
            andClauses.push({ status: { notIn: ["resolved", "closed", "cancelled"] } }, {
                OR: [
                    { slaResolutionDue: null },
                    { slaResolutionDue: { gt: atRiskThreshold } },
                ],
            }, { slaResolutionMet: { not: false } });
        }
        if (search) {
            andClauses.push({
                OR: [
                    { ticketNumber: { contains: search, mode: "insensitive" } },
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ],
            });
        }
        if (andClauses.length > 0) {
            where["AND"] = andClauses;
        }
        const [incidents, total] = await Promise.all([
            this.prisma.incident.findMany({
                where,
                skip,
                take: limit,
                include: {
                    reporter: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    assignee: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    team: { select: { id: true, name: true } },
                    category: { select: { id: true, name: true, parentId: true } },
                    configurationItems: {
                        include: {
                            configurationItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                    status: true,
                                    criticality: true,
                                    environment: true,
                                },
                            },
                        },
                    },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.incident.count({ where }),
        ]);
        return {
            data: incidents.map((incident) => this.toIncidentResponse(incident)),
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
                hasNext: skip + limit < total,
                hasPrev: page > 1,
            },
        };
    }
    async findOne(id, organizationId) {
        const incident = await this.prisma.incident.findFirst({
            where: { id, organizationId },
            include: {
                reporter: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                },
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true, avatarUrl: true },
                },
                team: true,
                category: true,
                slaPolicy: true,
                problem: {
                    select: { id: true, ticketNumber: true, title: true, status: true },
                },
                changeRequest: {
                    select: { id: true, ticketNumber: true, title: true, status: true, type: true },
                },
                comments: {
                    include: {
                        author: {
                            select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
                timeline: {
                    orderBy: { createdAt: "asc" },
                },
                workflows: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        name: true,
                        type: true,
                        status: true,
                        currentStepId: true,
                        createdAt: true,
                        updatedAt: true,
                    },
                },
                tasks: {
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        priority: true,
                        workflowId: true,
                        dueAt: true,
                        createdAt: true,
                    },
                },
                configurationItems: {
                    include: {
                        configurationItem: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                status: true,
                                criticality: true,
                                environment: true,
                            },
                        },
                    },
                },
            },
        });
        if (!incident) {
            throw new common_1.NotFoundException("Incident not found");
        }
        return this.toIncidentResponse(incident);
    }
    async getOptions(organizationId) {
        const [categories, configurationItems, problems, knowledgeArticles] = await Promise.all([
            this.prisma.incidentCategory.findMany({
                where: { organizationId },
                select: {
                    id: true,
                    name: true,
                    parentId: true,
                },
                orderBy: [{ name: "asc" }],
            }),
            this.prisma.configurationItem.findMany({
                where: { organizationId, status: { not: "retired" } },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    criticality: true,
                    environment: true,
                },
                orderBy: [{ criticality: "desc" }, { name: "asc" }],
            }),
            this.prisma.problem.findMany({
                where: { organizationId },
                select: { id: true, ticketNumber: true, title: true, status: true },
                orderBy: { createdAt: "desc" },
                take: 100,
            }),
            this.prisma.knowledgeArticle.findMany({
                where: { organizationId, status: "published" },
                select: { id: true, title: true },
                orderBy: { title: "asc" },
                take: 100,
            }),
        ]);
        return {
            channels: ["portal", "email", "phone", "chat", "api"],
            problems,
            knowledgeArticles,
            pendingReasons: [
                "awaiting_customer",
                "awaiting_vendor",
                "awaiting_change_window",
                "awaiting_security_approval",
            ],
            closureCodes: ["solved", "workaround_applied", "duplicate", "not_reproducible", "cancelled_by_requester"],
            categories,
            configurationItems,
        };
    }
    async update(id, organizationId, dto) {
        const existing = await this.prisma.incident.findFirst({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Incident not found");
        }
        const updateData = {};
        if (dto.title)
            updateData.title = dto.title;
        if (dto.description)
            updateData.description = dto.description;
        if (dto.priority)
            updateData.priority = dto.priority;
        if (dto.teamId)
            updateData.team = { connect: { id: dto.teamId } };
        if (dto.assigneeId)
            updateData.assignee = { connect: { id: dto.assigneeId } };
        if (dto.tags)
            updateData.tags = dto.tags;
        if (dto.dueAt)
            updateData["dueAt"] = new Date(dto.dueAt);
        if (dto.configurationItemIds !== undefined) {
            const validatedIds = await this.configurationItemsService.validateConfigurationItemIds(organizationId, dto.configurationItemIds);
            updateData.configurationItems = {
                deleteMany: {},
                ...(validatedIds.length > 0
                    ? {
                        create: validatedIds.map((configurationItemId) => ({
                            configurationItem: { connect: { id: configurationItemId } },
                        })),
                    }
                    : {}),
            };
        }
        if (dto.status && dto.status !== existing.status) {
            throw new common_1.BadRequestException("Direct status updates are disabled. Use POST /incidents/:id/transition for strict ITIL transitions.");
        }
        const updated = await this.prisma.incident.update({
            where: { id },
            data: updateData,
            include: {
                reporter: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                team: true,
                configurationItems: {
                    include: {
                        configurationItem: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                status: true,
                                criticality: true,
                                environment: true,
                            },
                        },
                    },
                },
            },
        });
        return this.toIncidentResponse(updated);
    }
    async transitionStrict(id, organizationId, userId, dto) {
        const existing = await this.prisma.incident.findFirst({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Incident not found");
        }
        const fromStatus = this.normalizeStatus(existing.status);
        const toStatus = this.normalizeStatus(dto.toStatus);
        if (!this.strictTransitionMap[fromStatus]) {
            throw new common_1.BadRequestException(`Unsupported current incident status: ${existing.status}`);
        }
        if (fromStatus === toStatus) {
            const current = await this.prisma.incident.findFirst({
                where: { id, organizationId },
                include: {
                    reporter: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    assignee: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    team: { select: { id: true, name: true } },
                    configurationItems: {
                        include: {
                            configurationItem: {
                                select: {
                                    id: true,
                                    name: true,
                                    type: true,
                                    status: true,
                                    criticality: true,
                                    environment: true,
                                },
                            },
                        },
                    },
                },
            });
            return current ? this.toIncidentResponse(current) : current;
        }
        const allowedTargets = this.strictTransitionMap[fromStatus];
        if (!allowedTargets.includes(toStatus)) {
            throw new common_1.BadRequestException(`Invalid strict transition from ${fromStatus} to ${toStatus}`);
        }
        await this.assertStrictTransitionGates(existing, organizationId, fromStatus, toStatus, dto);
        const updateData = {
            status: toStatus,
            updatedAt: new Date(),
        };
        const now = new Date();
        const isActiveState = toStatus === "assigned" || toStatus === "in_progress" || toStatus === "escalated";
        if (isActiveState && !existing.slaResponseAt) {
            updateData.slaResponseAt = now;
            if (existing.slaResponseDue) {
                updateData.slaResponseMet = now.getTime() <= existing.slaResponseDue.getTime();
            }
        }
        if (dto.assigneeId) {
            updateData.assignee = { connect: { id: dto.assigneeId } };
        }
        if (dto.teamId) {
            updateData.team = { connect: { id: dto.teamId } };
        }
        if (dto.problemId && (toStatus === "resolved" || toStatus === "closed")) {
            updateData.problem = { connect: { id: dto.problemId } };
        }
        if (toStatus === "pending") {
            updateData.onHoldReason = dto.pendingReason;
            updateData.onHoldUntil = dto.onHoldUntil ? new Date(dto.onHoldUntil) : null;
            if (!existing.slaPausedAt) {
                updateData.slaPausedAt = now;
            }
        }
        else {
            updateData.onHoldReason = null;
            updateData.onHoldUntil = null;
            if (fromStatus === "pending" && existing.slaPausedAt) {
                const pausedMinutes = this.diffMinutes(existing.slaPausedAt, now);
                if (pausedMinutes > 0) {
                    if (existing.slaResponseDue && !existing.slaResponseAt) {
                        updateData.slaResponseDue = this.addMinutes(existing.slaResponseDue, pausedMinutes);
                    }
                    if (existing.slaResolutionDue && !existing.resolvedAt) {
                        updateData.slaResolutionDue = this.addMinutes(existing.slaResolutionDue, pausedMinutes);
                    }
                    updateData.slaTotalPausedMins = (existing.slaTotalPausedMins || 0) + pausedMinutes;
                }
            }
            updateData.slaPausedAt = null;
        }
        if (toStatus === "resolved") {
            const effectiveResolutionDue = updateData.slaResolutionDue || existing.slaResolutionDue;
            updateData.resolvedAt = now;
            if (effectiveResolutionDue) {
                updateData.slaResolutionMet = now.getTime() <= effectiveResolutionDue.getTime();
            }
        }
        if (fromStatus === "resolved" && toStatus === "in_progress") {
            updateData.resolvedAt = null;
            updateData.closedAt = null;
            updateData.slaResolutionMet = null;
        }
        if (toStatus === "closed") {
            updateData.closedAt = now;
        }
        if (toStatus === "cancelled") {
            updateData.closedAt = now;
        }
        const updated = await this.prisma.incident.update({
            where: { id },
            data: updateData,
            include: {
                reporter: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                team: { select: { id: true, name: true } },
                configurationItems: {
                    include: {
                        configurationItem: {
                            select: {
                                id: true,
                                name: true,
                                type: true,
                                status: true,
                                criticality: true,
                                environment: true,
                            },
                        },
                    },
                },
            },
        });
        const transitionMetadata = this.cleanMetadata({
            caseType: "incident",
            strict: true,
            transitionFrom: fromStatus,
            transitionTo: toStatus,
            reason: dto.reason,
            comment: dto.comment,
            pendingReason: dto.pendingReason,
            resolutionSummary: dto.resolutionSummary,
            closureCode: dto.closureCode,
            problemId: dto.problemId,
            knowledgeArticleId: dto.knowledgeArticleId,
            slaPausedAt: toStatus === "pending" ? now.toISOString() : null,
            ...(dto.metadata || {}),
        }) || {};
        await this.createTimelineEntry(id, "strict_transition", fromStatus, toStatus, userId, transitionMetadata);
        await this.activitiesService.create({
            organizationId,
            entityType: "incident",
            entityId: id,
            action: "transitioned",
            actorId: userId,
            title: `Incident ${existing.ticketNumber || existing.id} transitioned`,
            description: `${fromStatus} -> ${toStatus}`,
            metadata: transitionMetadata,
        });
        await this.createTransitionAuditLog({
            organizationId,
            actorId: userId,
            incidentId: id,
            fromStatus,
            toStatus,
            previousIncident: existing,
            transitionMetadata,
        });
        return this.toIncidentResponse(updated);
    }
    async addComment(incidentId, organizationId, authorId, content, isInternal = false) {
        const incident = await this.prisma.incident.findFirst({
            where: { id: incidentId, organizationId },
            select: { id: true, ticketNumber: true, title: true },
        });
        if (!incident) {
            throw new common_1.NotFoundException("Incident not found");
        }
        if (!content || !content.trim()) {
            throw new common_1.BadRequestException("Comment content is required");
        }
        const comment = await this.prisma.incidentComment.create({
            data: {
                incidentId,
                authorId,
                content: content.trim(),
                isInternal,
            },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, avatarUrl: true },
                },
            },
        });
        await this.createTimelineEntry(incidentId, "comment_added", undefined, isInternal ? "internal" : "public", authorId, this.cleanMetadata({
            caseType: "incident",
            commentId: comment.id,
            isInternal,
        }));
        await this.activitiesService.create({
            organizationId,
            entityType: "incident",
            entityId: incidentId,
            action: "commented",
            actorId: authorId,
            title: `Comment added to ${incident.ticketNumber || incident.id}`,
            description: content.trim().slice(0, 140),
            metadata: {
                caseType: "incident",
                commentId: comment.id,
                isInternal,
            },
        });
        return comment;
    }
    async findPotentialDuplicates(organizationId, incidentId, limit = 5) {
        const baseIncident = await this.prisma.incident.findFirst({
            where: { id: incidentId, organizationId },
            select: {
                id: true,
                ticketNumber: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                categoryId: true,
                channel: true,
                createdAt: true,
                configurationItems: {
                    select: { configurationItemId: true },
                },
            },
        });
        if (!baseIncident) {
            throw new common_1.NotFoundException("Incident not found");
        }
        const candidates = await this.prisma.incident.findMany({
            where: {
                organizationId,
                id: { not: incidentId },
                status: { notIn: ["closed", "cancelled"] },
            },
            select: {
                id: true,
                ticketNumber: true,
                title: true,
                description: true,
                status: true,
                priority: true,
                categoryId: true,
                channel: true,
                createdAt: true,
                configurationItems: {
                    select: { configurationItemId: true },
                },
            },
            orderBy: { createdAt: "desc" },
            take: 80,
        });
        const scored = candidates
            .map((candidate) => ({
            id: candidate.id,
            ticketNumber: candidate.ticketNumber,
            title: candidate.title,
            status: candidate.status,
            priority: candidate.priority,
            createdAt: candidate.createdAt,
            similarityScore: this.calculateDuplicateSimilarity(baseIncident, candidate),
        }))
            .filter((candidate) => candidate.similarityScore >= 0.25)
            .sort((left, right) => right.similarityScore - left.similarityScore)
            .slice(0, limit);
        return {
            target: {
                id: baseIncident.id,
                ticketNumber: baseIncident.ticketNumber,
                title: baseIncident.title,
                status: baseIncident.status,
            },
            duplicates: scored,
        };
    }
    async mergeIncidents(organizationId, actorId, dto) {
        const sourceIncidentIds = Array.from(new Set((dto.sourceIncidentIds || []).filter((id) => id && id !== dto.targetIncidentId)));
        if (sourceIncidentIds.length === 0) {
            throw new common_1.BadRequestException("At least one source incident is required");
        }
        const incidents = await this.prisma.incident.findMany({
            where: {
                organizationId,
                id: { in: [dto.targetIncidentId, ...sourceIncidentIds] },
            },
            select: {
                id: true,
                ticketNumber: true,
                title: true,
                status: true,
                tags: true,
            },
        });
        if (incidents.length !== sourceIncidentIds.length + 1) {
            throw new common_1.NotFoundException("One or more incidents were not found in this organization");
        }
        const target = incidents.find((incident) => incident.id === dto.targetIncidentId);
        if (!target) {
            throw new common_1.NotFoundException("Target incident not found");
        }
        if (["closed", "cancelled"].includes(target.status)) {
            throw new common_1.BadRequestException("Target incident must be active to accept merged incidents");
        }
        const now = new Date();
        await this.prisma.$transaction(async (tx) => {
            for (const sourceIncidentId of sourceIncidentIds) {
                const source = incidents.find((incident) => incident.id === sourceIncidentId);
                if (!source)
                    continue;
                const mergedTags = Array.from(new Set([...(source.tags || []), "duplicate"]));
                await tx.incident.update({
                    where: { id: source.id },
                    data: {
                        status: "cancelled",
                        closedAt: now,
                        tags: mergedTags,
                        onHoldReason: null,
                        onHoldUntil: null,
                    },
                });
                await tx.incidentTimeline.create({
                    data: {
                        incidentId: source.id,
                        action: "merged_into",
                        actorId,
                        previousValue: source.status,
                        newValue: "cancelled",
                        metadata: {
                            caseType: "incident",
                            targetIncidentId: dto.targetIncidentId,
                            reason: dto.reason || "duplicate_merge",
                        },
                    },
                });
            }
            await tx.incidentTimeline.create({
                data: {
                    incidentId: dto.targetIncidentId,
                    action: "merged_from",
                    actorId,
                    metadata: {
                        caseType: "incident",
                        sourceIncidentIds,
                        reason: dto.reason || "duplicate_merge",
                    },
                },
            });
            await tx.auditLog.create({
                data: {
                    organizationId,
                    actorId,
                    actorType: "user",
                    action: "incident_merge",
                    resource: "incident",
                    resourceId: dto.targetIncidentId,
                    previousValue: {
                        sourceIncidentIds,
                    },
                    newValue: {
                        targetIncidentId: dto.targetIncidentId,
                    },
                    metadata: {
                        reason: dto.reason || "duplicate_merge",
                    },
                    correlationId: `incident-merge-${dto.targetIncidentId}-${Date.now()}`,
                },
            });
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "incident",
            entityId: dto.targetIncidentId,
            action: "merged_duplicates",
            actorId,
            title: `Merged ${sourceIncidentIds.length} duplicate incident(s) into ${target.ticketNumber || target.id}`,
            description: dto.reason || "Duplicate incident merge",
            metadata: {
                sourceIncidentIds,
            },
        });
        const mergedIncident = await this.findOne(dto.targetIncidentId, organizationId);
        return {
            data: mergedIncident,
            mergedCount: sourceIncidentIds.length,
            mergedIncidentIds: sourceIncidentIds,
        };
    }
    normalizeStatus(status) {
        const value = (status || "").toLowerCase();
        if (value === "open") {
            return "assigned";
        }
        if (value === "new" ||
            value === "assigned" ||
            value === "in_progress" ||
            value === "pending" ||
            value === "resolved" ||
            value === "closed" ||
            value === "cancelled" ||
            value === "escalated") {
            return value;
        }
        throw new common_1.BadRequestException(`Unsupported incident status: ${status}`);
    }
    toIncidentResponse(incident) {
        const configurationItems = Array.isArray(incident?.configurationItems)
            ? incident.configurationItems
                .map((link) => link.configurationItem || link)
                .filter((item) => item?.id)
            : [];
        return {
            ...incident,
            configurationItems,
            configurationItemIds: configurationItems.map((item) => item.id),
        };
    }
    async assertStrictTransitionGates(incident, organizationId, fromStatus, toStatus, dto) {
        const effectiveAssigneeId = dto.assigneeId || incident.assigneeId;
        const effectiveTeamId = dto.teamId || incident.teamId;
        if (dto.assigneeId) {
            const assignee = await this.prisma.user.findFirst({
                where: { id: dto.assigneeId, organizationId },
            });
            if (!assignee) {
                throw new common_1.BadRequestException(`Assignee ${dto.assigneeId} was not found in organization`);
            }
        }
        if (dto.teamId) {
            const team = await this.prisma.team.findFirst({
                where: { id: dto.teamId, organizationId },
            });
            if (!team) {
                throw new common_1.BadRequestException(`Team ${dto.teamId} was not found in organization`);
            }
        }
        if (toStatus === "assigned" || toStatus === "in_progress" || toStatus === "escalated") {
            if (!effectiveAssigneeId && !effectiveTeamId) {
                throw new common_1.BadRequestException(`Transition to ${toStatus} requires an assignee or team ownership`);
            }
        }
        if (toStatus === "pending" && !dto.pendingReason) {
            throw new common_1.BadRequestException("Transition to pending requires pendingReason");
        }
        if (toStatus === "resolved") {
            if (!dto.resolutionSummary) {
                throw new common_1.BadRequestException("Transition to resolved requires resolutionSummary");
            }
            const openWorkflowTasks = await this.prisma.task.count({
                where: {
                    organizationId,
                    incidentId: incident.id,
                    status: { in: ["pending", "in_progress"] },
                    OR: [{ workflowId: { not: null } }, { sourceEntityType: "workflow" }],
                },
            });
            if (openWorkflowTasks > 0) {
                throw new common_1.BadRequestException("All correlated workflow tasks must be completed before resolving this incident");
            }
        }
        if (toStatus === "closed") {
            if (fromStatus !== "resolved") {
                throw new common_1.BadRequestException("Only resolved incidents can be closed");
            }
            if (!dto.closureCode) {
                throw new common_1.BadRequestException("Transition to closed requires closureCode");
            }
        }
        if (toStatus === "cancelled" && !dto.reason) {
            throw new common_1.BadRequestException("Transition to cancelled requires reason");
        }
    }
    async createTransitionAuditLog(params) {
        await this.prisma.auditLog.create({
            data: {
                organizationId: params.organizationId,
                actorId: params.actorId,
                actorType: "user",
                action: "incident_transition",
                resource: "incident",
                resourceId: params.incidentId,
                previousValue: {
                    status: params.fromStatus,
                    assigneeId: params.previousIncident.assigneeId,
                    teamId: params.previousIncident.teamId,
                    priority: params.previousIncident.priority,
                },
                newValue: {
                    status: params.toStatus,
                },
                metadata: params.transitionMetadata,
                correlationId: `incident-transition-${params.incidentId}-${Date.now()}`,
            },
        });
    }
    async createTimelineEntry(incidentId, action, previousValue, newValue, actorId, metadata) {
        return this.prisma.incidentTimeline.create({
            data: {
                incidentId,
                action,
                actorId,
                previousValue,
                newValue,
                metadata: this.cleanMetadata(metadata),
            },
        });
    }
    cleanMetadata(metadata) {
        if (!metadata) {
            return undefined;
        }
        const cleaned = Object.entries(metadata).reduce((acc, [key, value]) => {
            if (value !== undefined) {
                acc[key] = value;
            }
            return acc;
        }, {});
        return Object.keys(cleaned).length > 0 ? cleaned : undefined;
    }
    diffMinutes(from, to) {
        return Math.max(0, Math.ceil((to.getTime() - from.getTime()) / 60000));
    }
    addMinutes(date, minutes) {
        return new Date(date.getTime() + minutes * 60000);
    }
    calculateDuplicateSimilarity(source, candidate) {
        const titleSimilarity = this.jaccardSimilarity(source.title, candidate.title);
        const descriptionSimilarity = this.jaccardSimilarity(source.description || "", candidate.description || "");
        const sameCategory = !!source.categoryId &&
            !!candidate.categoryId &&
            source.categoryId === candidate.categoryId
            ? 1
            : 0;
        const sameChannel = source.channel === candidate.channel ? 1 : 0;
        const samePriority = source.priority === candidate.priority ? 1 : 0;
        const sourceConfigurationItems = new Set(source.configurationItems.map((item) => item.configurationItemId));
        const candidateConfigurationItems = new Set(candidate.configurationItems.map((item) => item.configurationItemId));
        const sharedConfigurationItems = Array.from(sourceConfigurationItems).filter((id) => candidateConfigurationItems.has(id)).length;
        const sameConfigurationItems = sharedConfigurationItems > 0 ? 1 : 0;
        const weightedScore = titleSimilarity * 0.5 +
            descriptionSimilarity * 0.2 +
            sameCategory * 0.1 +
            sameChannel * 0.1 +
            samePriority * 0.05 +
            sameConfigurationItems * 0.05;
        return Number(weightedScore.toFixed(3));
    }
    jaccardSimilarity(left, right) {
        const leftTokens = this.tokenizeText(left);
        const rightTokens = this.tokenizeText(right);
        if (leftTokens.size === 0 || rightTokens.size === 0) {
            return 0;
        }
        const intersectionSize = Array.from(leftTokens).filter((token) => rightTokens.has(token)).length;
        const unionSize = new Set([...leftTokens, ...rightTokens]).size;
        return unionSize === 0 ? 0 : intersectionSize / unionSize;
    }
    tokenizeText(value) {
        return new Set((value || "")
            .toLowerCase()
            .replace(/[^a-z0-9\s]/g, " ")
            .split(/\s+/)
            .map((token) => token.trim())
            .filter((token) => token.length >= 3));
    }
};
exports.IncidentsService = IncidentsService;
exports.IncidentsService = IncidentsService = IncidentsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tickets_service_1.TicketsService,
        priority_matrix_service_1.PriorityMatrixService,
        sla_calculation_service_1.SLACalculationService,
        activities_service_1.ActivitiesService,
        workflows_service_1.WorkflowsService,
        configuration_items_service_1.ConfigurationItemsService])
], IncidentsService);
//# sourceMappingURL=incidents.service.js.map