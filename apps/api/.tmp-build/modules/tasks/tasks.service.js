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
var TasksService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const create_task_dto_1 = require("./dto/create-task.dto");
const system_links_1 = require("@/common/system-links/system-links");
const activities_service_1 = require("../activities/activities.service");
let TasksService = TasksService_1 = class TasksService {
    prisma;
    activitiesService;
    logger = new common_1.Logger(TasksService_1.name);
    constructor(prisma, activitiesService) {
        this.prisma = prisma;
        this.activitiesService = activitiesService;
    }
    async getOptions(organizationId) {
        const [users, teams] = await Promise.all([
            this.prisma.user.findMany({
                where: { organizationId, isActive: true },
                select: { id: true, firstName: true, lastName: true, email: true },
                orderBy: [{ firstName: "asc" }, { lastName: "asc" }],
            }),
            this.prisma.team.findMany({
                where: { organizationId },
                select: { id: true, name: true },
                orderBy: { name: "asc" },
            }),
        ]);
        return { users, teams };
    }
    async create(organizationId, userId, dto) {
        const task = await this.prisma.task.create({
            data: {
                title: dto.title,
                description: dto.description,
                status: dto.status || create_task_dto_1.TaskStatus.PENDING,
                priority: dto.priority || create_task_dto_1.TaskPriority.MEDIUM,
                organizationId,
                assigneeId: dto.assigneeId,
                reporterId: userId,
                incidentId: dto.incidentId,
                workflowId: dto.workflowId,
                violationId: dto.violationId,
                policyId: dto.policyId,
                sourceEntityId: dto.sourceEntityId,
                sourceEntityType: dto.sourceEntityType,
                teamId: dto.teamId,
                dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
                estimatedMinutes: dto.estimatedMinutes,
                tags: dto.tags || [],
                metadata: dto.metadata || {},
            },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
                reporter: { select: { firstName: true, lastName: true } },
                incident: { select: { title: true } },
                team: { select: { name: true } },
            },
        });
        this.logger.log(`Task created: ${task.id} by user ${userId}`);
        await this.activitiesService.create({
            organizationId,
            entityType: "task",
            entityId: task.id,
            action: "created",
            actorId: userId,
            title: `Task "${task.title}" created`,
            description: dto.description,
            metadata: { priority: dto.priority, sourceEntityType: dto.sourceEntityType, sourceEntityId: dto.sourceEntityId },
        });
        return this.toEntity(task);
    }
    async findAll(organizationId, query) {
        const { page = 1, limit = 20, status, priority, assigneeId, incidentId, workflowId, teamId, violationId, policyId, sourceEntityId, sourceEntityType, systemRecordId, overdue, dueFrom, dueTo, search, } = query;
        const skip = (page - 1) * limit;
        const parsedSystemRecord = (0, system_links_1.parseSystemRecordId)(systemRecordId);
        const taskIdFromSystemRecord = parsedSystemRecord?.type === "task" ? parsedSystemRecord.id : undefined;
        const now = new Date();
        const where = {
            organizationId,
            ...(status && { status }),
            ...(priority && { priority }),
            ...(assigneeId && { assigneeId }),
            ...(taskIdFromSystemRecord && { id: taskIdFromSystemRecord }),
            ...(incidentId && { incidentId }),
            ...(workflowId && { workflowId }),
            ...(teamId && { teamId }),
            ...(violationId && { violationId }),
            ...(policyId && { policyId }),
            ...(sourceEntityId && { sourceEntityId }),
            ...(sourceEntityType && { sourceEntityType }),
            ...(dueFrom && { dueAt: { gte: new Date(dueFrom) } }),
            ...(dueTo && { dueAt: { lte: new Date(dueTo) } }),
            ...(overdue && {
                dueAt: { lt: now },
                status: { notIn: [create_task_dto_1.TaskStatus.COMPLETED, create_task_dto_1.TaskStatus.CANCELLED] },
            }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ],
            }),
        };
        const [tasks, total] = await Promise.all([
            this.prisma.task.findMany({
                where,
                skip,
                take: limit,
                orderBy: [
                    { priority: "desc" },
                    { dueAt: "asc" },
                    { createdAt: "desc" },
                ],
                include: {
                    assignee: { select: { firstName: true, lastName: true } },
                    reporter: { select: { firstName: true, lastName: true } },
                    incident: { select: { title: true } },
                    team: { select: { name: true } },
                },
            }),
            this.prisma.task.count({ where }),
        ]);
        return {
            data: tasks.map((t) => this.toEntity(t)),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, organizationId) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
                reporter: { select: { firstName: true, lastName: true } },
                incident: { select: { title: true } },
                team: { select: { name: true } },
            },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        return this.toEntity(task);
    }
    async update(id, organizationId, userId, dto) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                ...dto,
                dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
                updatedAt: new Date(),
            },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
                reporter: { select: { firstName: true, lastName: true } },
                incident: { select: { title: true } },
                team: { select: { name: true } },
            },
        });
        this.logger.log(`Task updated: ${id} by user ${userId}`);
        return this.toEntity(updated);
    }
    async assign(id, organizationId, userId, dto) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        if (dto.assigneeId) {
            const assignee = await this.prisma.user.findFirst({
                where: { id: dto.assigneeId, organizationId },
            });
            if (!assignee) {
                throw new common_1.NotFoundException(`User ${dto.assigneeId} not found`);
            }
        }
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                assigneeId: dto.assigneeId,
                updatedAt: new Date(),
            },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
                reporter: { select: { firstName: true, lastName: true } },
                incident: { select: { title: true } },
                team: { select: { name: true } },
            },
        });
        this.logger.log(`Task assigned: ${id} to ${dto.assigneeId || "unassigned"} by user ${userId}`);
        await this.activitiesService.create({
            organizationId,
            entityType: "task",
            entityId: id,
            action: "assigned",
            actorId: userId,
            title: dto.assigneeId ? `Task "${task.title}" assigned` : `Task "${task.title}" unassigned`,
            description: dto.assigneeId ? `Assigned to user ${dto.assigneeId}` : "Task unassigned",
            metadata: { assigneeId: dto.assigneeId },
        });
        return this.toEntity(updated);
    }
    async start(id, organizationId, userId, dto) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        if (task.status !== create_task_dto_1.TaskStatus.PENDING) {
            throw new common_1.BadRequestException("Can only start pending tasks");
        }
        const existingMetadata = task.metadata || {};
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                status: create_task_dto_1.TaskStatus.IN_PROGRESS,
                startedAt: new Date(),
                updatedAt: new Date(),
                metadata: {
                    ...existingMetadata,
                    ...(dto.note ? { startNote: dto.note } : {}),
                },
            },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
                reporter: { select: { firstName: true, lastName: true } },
                incident: { select: { title: true } },
                team: { select: { name: true } },
            },
        });
        this.logger.log(`Task started: ${id} by user ${userId}`);
        await this.activitiesService.create({
            organizationId,
            entityType: "task",
            entityId: id,
            action: "started",
            actorId: userId,
            title: `Task "${task.title}" started`,
            description: dto.note,
            metadata: {
                previousStatus: create_task_dto_1.TaskStatus.PENDING,
                newStatus: create_task_dto_1.TaskStatus.IN_PROGRESS,
                ...(dto.note ? { note: dto.note } : {}),
            },
        });
        return this.toEntity(updated);
    }
    async complete(id, organizationId, userId, dto) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        if (task.status === create_task_dto_1.TaskStatus.COMPLETED || task.status === create_task_dto_1.TaskStatus.CANCELLED) {
            throw new common_1.BadRequestException("Task is already completed or cancelled");
        }
        const existingMetadata = task.metadata || {};
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                status: create_task_dto_1.TaskStatus.COMPLETED,
                completedAt: new Date(),
                actualMinutes: dto.actualMinutes,
                updatedAt: new Date(),
                metadata: {
                    ...existingMetadata,
                    ...(dto.note ? { completionNote: dto.note } : {}),
                },
            },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
                reporter: { select: { firstName: true, lastName: true } },
                incident: { select: { title: true } },
                team: { select: { name: true } },
            },
        });
        this.logger.log(`Task completed: ${id} by user ${userId}`);
        await this.activitiesService.create({
            organizationId,
            entityType: "task",
            entityId: id,
            action: "completed",
            actorId: userId,
            title: `Task "${task.title}" completed`,
            description: dto.note,
            metadata: {
                actualMinutes: dto.actualMinutes,
                ...(dto.note ? { note: dto.note } : {}),
            },
        });
        return this.toEntity(updated);
    }
    async reopen(id, organizationId, userId, dto) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        if (task.status !== create_task_dto_1.TaskStatus.COMPLETED && task.status !== create_task_dto_1.TaskStatus.CANCELLED) {
            throw new common_1.BadRequestException("Can only reopen completed or cancelled tasks");
        }
        const existingMetadata = task.metadata || {};
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                status: create_task_dto_1.TaskStatus.PENDING,
                completedAt: null,
                updatedAt: new Date(),
                metadata: {
                    ...existingMetadata,
                    reopenReason: dto.reason,
                    reopenedBy: userId,
                    reopenedAt: new Date(),
                },
            },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
                reporter: { select: { firstName: true, lastName: true } },
                incident: { select: { title: true } },
                team: { select: { name: true } },
            },
        });
        this.logger.log(`Task reopened: ${id} by user ${userId}`);
        await this.activitiesService.create({
            organizationId,
            entityType: "task",
            entityId: id,
            action: "reopened",
            actorId: userId,
            title: `Task "${task.title}" reopened`,
            description: dto.reason,
            metadata: { previousStatus: task.status, newStatus: create_task_dto_1.TaskStatus.PENDING },
        });
        return this.toEntity(updated);
    }
    async cancel(id, organizationId, userId, reason) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        if (task.status === create_task_dto_1.TaskStatus.COMPLETED) {
            throw new common_1.BadRequestException("Cannot cancel a completed task");
        }
        const existingMetadata = task.metadata || {};
        const updated = await this.prisma.task.update({
            where: { id },
            data: {
                status: create_task_dto_1.TaskStatus.CANCELLED,
                updatedAt: new Date(),
                metadata: {
                    ...existingMetadata,
                    cancellationReason: reason,
                    cancelledBy: userId,
                    cancelledAt: new Date(),
                },
            },
            include: {
                assignee: { select: { firstName: true, lastName: true } },
                reporter: { select: { firstName: true, lastName: true } },
                incident: { select: { title: true } },
                team: { select: { name: true } },
            },
        });
        this.logger.log(`Task cancelled: ${id} by user ${userId}`);
        await this.activitiesService.create({
            organizationId,
            entityType: "task",
            entityId: id,
            action: "cancelled",
            actorId: userId,
            title: `Task "${task.title}" cancelled`,
            description: reason,
            metadata: { previousStatus: task.status, newStatus: create_task_dto_1.TaskStatus.CANCELLED },
        });
        return this.toEntity(updated);
    }
    async getStats(organizationId) {
        const now = new Date();
        const [total, pending, inProgress, completed, overdue, critical, high, completedTasks] = await Promise.all([
            this.prisma.task.count({ where: { organizationId } }),
            this.prisma.task.count({ where: { organizationId, status: create_task_dto_1.TaskStatus.PENDING } }),
            this.prisma.task.count({ where: { organizationId, status: create_task_dto_1.TaskStatus.IN_PROGRESS } }),
            this.prisma.task.count({ where: { organizationId, status: create_task_dto_1.TaskStatus.COMPLETED } }),
            this.prisma.task.count({
                where: {
                    organizationId,
                    dueAt: { lt: now },
                    status: { notIn: [create_task_dto_1.TaskStatus.COMPLETED, create_task_dto_1.TaskStatus.CANCELLED] },
                },
            }),
            this.prisma.task.count({ where: { organizationId, priority: create_task_dto_1.TaskPriority.CRITICAL } }),
            this.prisma.task.count({ where: { organizationId, priority: create_task_dto_1.TaskPriority.HIGH } }),
            this.prisma.task.findMany({
                where: { organizationId, status: create_task_dto_1.TaskStatus.COMPLETED, actualMinutes: { not: null } },
                select: { actualMinutes: true },
            }),
        ]);
        const avgCompletionTime = completedTasks.length > 0
            ? completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0) / completedTasks.length
            : 0;
        return { total, pending, inProgress, completed, overdue, critical, high, avgCompletionTime };
    }
    async remove(id, organizationId, userId) {
        const task = await this.prisma.task.findFirst({
            where: { id, organizationId },
        });
        if (!task) {
            throw new common_1.NotFoundException(`Task ${id} not found`);
        }
        await this.prisma.task.delete({
            where: { id },
        });
        this.logger.log(`Task deleted: ${id} by user ${userId}`);
    }
    toEntity(task) {
        const systemRecordId = (0, system_links_1.toSystemRecordId)("task", task.id);
        const now = new Date();
        let slaStatus = "on_track";
        let timeRemaining;
        if (task.status === create_task_dto_1.TaskStatus.COMPLETED) {
            slaStatus = "completed";
        }
        else if (task.dueAt) {
            const dueDate = new Date(task.dueAt);
            const diffMinutes = Math.floor((dueDate.getTime() - now.getTime()) / 60000);
            timeRemaining = diffMinutes;
            if (diffMinutes < 0) {
                slaStatus = "breached";
            }
            else if (diffMinutes < 60) {
                slaStatus = "at_risk";
            }
            else {
                slaStatus = "on_track";
            }
        }
        return {
            id: task.id,
            title: task.title,
            description: task.description,
            status: task.status,
            priority: task.priority,
            assigneeId: task.assigneeId,
            assigneeName: task.assignee
                ? `${task.assignee.firstName} ${task.assignee.lastName}`
                : undefined,
            reporterId: task.reporterId,
            reporterName: task.reporter
                ? `${task.reporter.firstName} ${task.reporter.lastName}`
                : undefined,
            incidentId: task.incidentId,
            incidentTitle: task.incident?.title,
            workflowId: task.workflowId,
            violationId: task.violationId,
            policyId: task.policyId,
            sourceEntityId: task.sourceEntityId,
            sourceEntityType: task.sourceEntityType,
            teamId: task.teamId,
            teamName: task.team?.name,
            dueAt: task.dueAt,
            startedAt: task.startedAt,
            completedAt: task.completedAt,
            estimatedMinutes: task.estimatedMinutes,
            actualMinutes: task.actualMinutes,
            tags: task.tags,
            metadata: task.metadata,
            slaStatus,
            timeRemaining,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt,
            systemRecordId,
            traceContext: (0, system_links_1.toTraceContext)(systemRecordId, task.metadata),
            relatedRecords: (0, system_links_1.buildRelatedRecords)([
                { type: "incident", id: task.incidentId, relationship: "belongs_to_incident" },
                { type: "workflow", id: task.workflowId, relationship: "belongs_to_workflow" },
                { type: "violation", id: task.violationId, relationship: "remediates_violation" },
                { type: "policy", id: task.policyId, relationship: "implements_policy_control" },
                { type: task.sourceEntityType || "entity", id: task.sourceEntityId, relationship: "originated_from" },
            ]),
        };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = TasksService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activities_service_1.ActivitiesService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map