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
var ChangesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChangesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const tickets_service_1 = require("../tickets/tickets.service");
const priority_matrix_service_1 = require("../sla/priority-matrix.service");
const activities_service_1 = require("../activities/activities.service");
let ChangesService = ChangesService_1 = class ChangesService {
    prisma;
    ticketsService;
    priorityMatrix;
    activitiesService;
    logger = new common_1.Logger(ChangesService_1.name);
    constructor(prisma, ticketsService, priorityMatrix, activitiesService) {
        this.prisma = prisma;
        this.ticketsService = ticketsService;
        this.priorityMatrix = priorityMatrix;
        this.activitiesService = activitiesService;
    }
    async create(organizationId, userId, dto) {
        const ticketNumber = await this.ticketsService.generateTicketNumber(organizationId, "change");
        const changeRequest = await this.prisma.changeRequest.create({
            data: {
                ticketNumber,
                title: dto.title,
                description: dto.description,
                reason: dto.reason,
                type: dto.type || "normal",
                status: "draft",
                riskLevel: dto.riskLevel || "medium",
                impactLevel: dto.impactLevel || "medium",
                rollbackPlan: dto.rollbackPlan,
                testPlan: dto.testPlan,
                organizationId,
                requesterId: userId,
                assigneeId: dto.assigneeId,
                teamId: dto.teamId,
                plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
                plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
            },
            include: {
                requester: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                pirReviewedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                team: true,
            },
        });
        if (dto.incidentIds && dto.incidentIds.length > 0) {
            await this.prisma.incident.updateMany({
                where: {
                    id: { in: dto.incidentIds },
                    organizationId,
                },
                data: { changeRequestId: changeRequest.id },
            });
        }
        await this.activitiesService.create({
            organizationId,
            entityType: "change",
            entityId: changeRequest.id,
            action: "created",
            actorId: userId,
            title: `Change ${ticketNumber} created: ${changeRequest.title}`,
            description: dto.description,
            metadata: { type: dto.type, riskLevel: dto.riskLevel },
        });
        this.logger.log(`Change request created: ${ticketNumber} by user ${userId}`);
        return changeRequest;
    }
    async findAll(organizationId, query) {
        const { page = 1, limit = 20, status, type, search } = query;
        const skip = (page - 1) * limit;
        const where = { organizationId };
        if (status) {
            where["status"] = Array.isArray(status) ? { in: status } : status;
        }
        if (type) {
            where["type"] = Array.isArray(type) ? { in: type } : type;
        }
        if (search) {
            where["OR"] = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { ticketNumber: { contains: search, mode: "insensitive" } },
            ];
        }
        const [changes, total] = await Promise.all([
            this.prisma.changeRequest.findMany({
                where,
                skip,
                take: limit,
                include: {
                    requester: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    assignee: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    team: { select: { id: true, name: true } },
                    _count: { select: { approvals: true, tasks: true, incidents: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.changeRequest.count({ where }),
        ]);
        return {
            data: changes,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(organizationId, id) {
        const changeRequest = await this.prisma.changeRequest.findFirst({
            where: { id, organizationId },
            include: {
                requester: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                team: true,
                approvals: {
                    include: {
                        approver: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                    },
                },
                incidents: {
                    select: {
                        id: true,
                        ticketNumber: true,
                        title: true,
                        status: true,
                        priority: true,
                    },
                },
                tasks: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        assignee: { select: { id: true, firstName: true, lastName: true } },
                    },
                },
            },
        });
        if (!changeRequest) {
            throw new common_1.NotFoundException("Change request not found");
        }
        return changeRequest;
    }
    async update(organizationId, id, userId, dto) {
        const changeRequest = await this.findOne(organizationId, id);
        const updated = await this.prisma.changeRequest.update({
            where: { id },
            data: {
                ...dto,
                plannedStart: dto.plannedStart ? new Date(dto.plannedStart) : undefined,
                plannedEnd: dto.plannedEnd ? new Date(dto.plannedEnd) : undefined,
                actualStart: dto.actualStart ? new Date(dto.actualStart) : undefined,
                actualEnd: dto.actualEnd ? new Date(dto.actualEnd) : undefined,
            },
            include: {
                requester: true,
                assignee: true,
                team: true,
            },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "change",
            entityId: id,
            action: "updated",
            actorId: userId,
            title: `Change ${changeRequest.ticketNumber} updated`,
            metadata: { changes: dto },
        });
        return updated;
    }
    async submitForApproval(organizationId, id, userId) {
        const changeRequest = await this.findOne(organizationId, id);
        if (changeRequest.status !== "draft") {
            throw new common_1.BadRequestException("Only draft changes can be submitted for approval");
        }
        const updated = await this.prisma.changeRequest.update({
            where: { id },
            data: { status: "requested" },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "change",
            entityId: id,
            action: "submitted_for_approval",
            actorId: userId,
            title: `Change ${changeRequest.ticketNumber} submitted for approval`,
        });
        return updated;
    }
    async approve(organizationId, id, userId, comments) {
        const changeRequest = await this.findOne(organizationId, id);
        const approval = await this.prisma.changeApproval.upsert({
            where: {
                changeRequestId_approverId: {
                    changeRequestId: id,
                    approverId: userId,
                },
            },
            create: {
                changeRequestId: id,
                approverId: userId,
                status: "approved",
                comments,
                approvedAt: new Date(),
            },
            update: {
                status: "approved",
                comments,
                approvedAt: new Date(),
            },
        });
        const allApprovals = await this.prisma.changeApproval.findMany({
            where: { changeRequestId: id },
        });
        const allApproved = allApprovals.every((a) => a.status === "approved");
        if (allApproved) {
            await this.prisma.changeRequest.update({
                where: { id },
                data: { status: "approved" },
            });
        }
        await this.activitiesService.create({
            organizationId,
            entityType: "change",
            entityId: id,
            action: "approved",
            actorId: userId,
            title: `Change ${changeRequest.ticketNumber} approved`,
            metadata: { comments },
        });
        return approval;
    }
    async reject(organizationId, id, userId, reason) {
        const changeRequest = await this.findOne(organizationId, id);
        const approval = await this.prisma.changeApproval.upsert({
            where: {
                changeRequestId_approverId: {
                    changeRequestId: id,
                    approverId: userId,
                },
            },
            create: {
                changeRequestId: id,
                approverId: userId,
                status: "rejected",
                comments: reason,
            },
            update: {
                status: "rejected",
                comments: reason,
            },
        });
        await this.prisma.changeRequest.update({
            where: { id },
            data: { status: "rejected" },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "change",
            entityId: id,
            action: "rejected",
            actorId: userId,
            title: `Change ${changeRequest.ticketNumber} rejected`,
            metadata: { reason },
        });
        return approval;
    }
    async startImplementation(organizationId, id, userId) {
        const changeRequest = await this.findOne(organizationId, id);
        if (changeRequest.status !== "approved") {
            throw new common_1.BadRequestException("Only approved changes can be implemented");
        }
        const updated = await this.prisma.changeRequest.update({
            where: { id },
            data: {
                status: "implementing",
                actualStart: new Date(),
            },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "change",
            entityId: id,
            action: "implementation_started",
            actorId: userId,
            title: `Change ${changeRequest.ticketNumber} implementation started`,
        });
        return updated;
    }
    async complete(organizationId, id, userId, pir) {
        const changeRequest = await this.findOne(organizationId, id);
        if (changeRequest.status !== "implementing") {
            throw new common_1.BadRequestException("Only changes in implementation can be completed");
        }
        if (!pir?.pirSummary?.trim()) {
            throw new common_1.BadRequestException("PIR summary is required to complete a change");
        }
        const updated = await this.prisma.changeRequest.update({
            where: { id },
            data: {
                status: "completed",
                actualEnd: new Date(),
                pirStatus: "completed",
                pirSummary: pir.pirSummary.trim(),
                pirOutcome: pir.pirOutcome,
                pirCompletedAt: new Date(),
                pirReviewedById: userId,
            },
        });
        await this.prisma.incident.updateMany({
            where: { changeRequestId: id },
            data: { status: "resolved", resolvedAt: new Date() },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "change",
            entityId: id,
            action: "completed",
            actorId: userId,
            title: `Change ${changeRequest.ticketNumber} completed`,
            metadata: {
                pirStatus: "completed",
                pirOutcome: pir.pirOutcome,
            },
        });
        return updated;
    }
    async addTask(organizationId, changeId, userId, data) {
        const changeRequest = await this.findOne(organizationId, changeId);
        const task = await this.prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                organizationId,
                changeRequestId: changeId,
                assigneeId: data.assigneeId,
                reporterId: userId,
                sourceEntityType: "change",
                sourceEntityId: changeId,
            },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "task",
            entityId: task.id,
            action: "created",
            actorId: userId,
            title: `Task added to change ${changeRequest.ticketNumber}: ${data.title}`,
        });
        return task;
    }
};
exports.ChangesService = ChangesService;
exports.ChangesService = ChangesService = ChangesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tickets_service_1.TicketsService,
        priority_matrix_service_1.PriorityMatrixService,
        activities_service_1.ActivitiesService])
], ChangesService);
//# sourceMappingURL=changes.service.js.map