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
var ProblemsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProblemsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const tickets_service_1 = require("../tickets/tickets.service");
const priority_matrix_service_1 = require("../sla/priority-matrix.service");
const sla_calculation_service_1 = require("../sla/sla-calculation.service");
const activities_service_1 = require("../activities/activities.service");
let ProblemsService = ProblemsService_1 = class ProblemsService {
    prisma;
    ticketsService;
    priorityMatrix;
    slaCalculation;
    activitiesService;
    logger = new common_1.Logger(ProblemsService_1.name);
    constructor(prisma, ticketsService, priorityMatrix, slaCalculation, activitiesService) {
        this.prisma = prisma;
        this.ticketsService = ticketsService;
        this.priorityMatrix = priorityMatrix;
        this.slaCalculation = slaCalculation;
        this.activitiesService = activitiesService;
    }
    async create(organizationId, userId, dto) {
        const ticketNumber = await this.ticketsService.generateTicketNumber(organizationId, "problem");
        let priority = dto.priority || "medium";
        if (dto.impact && dto.urgency) {
            priority = this.priorityMatrix.calculatePriority(dto.impact, dto.urgency);
        }
        const problem = await this.prisma.problem.create({
            data: {
                ticketNumber,
                title: dto.title,
                description: dto.description,
                status: "new",
                priority,
                organizationId,
                assigneeId: dto.assigneeId,
                teamId: dto.teamId,
                impact: dto.impact || "medium",
                urgency: dto.urgency || "medium",
                isKnownError: dto.isKnownError || false,
                rootCause: dto.rootCause,
                workaround: dto.workaround,
                detectedAt: dto.detectedAt ? new Date(dto.detectedAt) : new Date(),
            },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                team: true,
                incidents: {
                    select: { id: true, ticketNumber: true, title: true, status: true },
                },
            },
        });
        if (dto.incidentIds && dto.incidentIds.length > 0) {
            await this.prisma.incident.updateMany({
                where: {
                    id: { in: dto.incidentIds },
                    organizationId,
                },
                data: { problemId: problem.id },
            });
        }
        await this.activitiesService.create({
            organizationId,
            entityType: "problem",
            entityId: problem.id,
            action: "created",
            actorId: userId,
            title: `Problem ${ticketNumber} created: ${problem.title}`,
            description: dto.description,
            metadata: { priority, impact: dto.impact, urgency: dto.urgency },
        });
        this.logger.log(`Problem created: ${ticketNumber} by user ${userId}`);
        return problem;
    }
    async getOptions(organizationId) {
        const [incidents, users, teams] = await Promise.all([
            this.prisma.incident.findMany({
                where: { organizationId },
                select: { id: true, ticketNumber: true, title: true, status: true },
                orderBy: { createdAt: "desc" },
                take: 100,
            }),
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
        return {
            incidents,
            users,
            teams,
        };
    }
    async findAll(organizationId, query) {
        const { page = 1, limit = 20, status, priority, search, isKnownError } = query;
        const skip = (page - 1) * limit;
        const where = { organizationId };
        if (status) {
            where["status"] = Array.isArray(status) ? { in: status } : status;
        }
        if (priority) {
            where["priority"] = Array.isArray(priority) ? { in: priority } : priority;
        }
        if (isKnownError === true || isKnownError === "true") {
            where["isKnownError"] = true;
        }
        if (search) {
            where["OR"] = [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { ticketNumber: { contains: search, mode: "insensitive" } },
            ];
        }
        const [problems, total] = await Promise.all([
            this.prisma.problem.findMany({
                where,
                skip,
                take: limit,
                include: {
                    assignee: {
                        select: { id: true, firstName: true, lastName: true, email: true },
                    },
                    team: { select: { id: true, name: true } },
                    _count: { select: { incidents: true, tasks: true } },
                },
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.problem.count({ where }),
        ]);
        return {
            data: problems,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(organizationId, id) {
        const problem = await this.prisma.problem.findFirst({
            where: { id, organizationId },
            include: {
                assignee: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                team: true,
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
        if (!problem) {
            throw new common_1.NotFoundException("Problem not found");
        }
        return problem;
    }
    async update(organizationId, id, userId, dto) {
        const problem = await this.findOne(organizationId, id);
        let priority = problem.priority;
        if (dto.impact || dto.urgency) {
            priority = this.priorityMatrix.calculatePriority(dto.impact || problem.impact, dto.urgency || problem.urgency);
        }
        const updated = await this.prisma.problem.update({
            where: { id },
            data: {
                ...dto,
                priority,
                resolvedAt: dto.status === "resolved" ? new Date() : problem.resolvedAt,
                closedAt: dto.status === "closed" ? new Date() : problem.closedAt,
            },
            include: {
                assignee: true,
                team: true,
            },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "problem",
            entityId: id,
            action: "updated",
            actorId: userId,
            title: `Problem ${problem.ticketNumber} updated`,
            metadata: { changes: dto },
        });
        return updated;
    }
    async addTask(organizationId, problemId, userId, data) {
        const problem = await this.findOne(organizationId, problemId);
        const task = await this.prisma.task.create({
            data: {
                title: data.title,
                description: data.description,
                organizationId,
                problemId,
                assigneeId: data.assigneeId,
                reporterId: userId,
                sourceEntityType: "problem",
                sourceEntityId: problemId,
            },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "task",
            entityId: task.id,
            action: "created",
            actorId: userId,
            title: `Task added to problem ${problem.ticketNumber}: ${data.title}`,
        });
        return task;
    }
    async convertToKnownError(organizationId, id, userId, data) {
        const problem = await this.findOne(organizationId, id);
        const updated = await this.prisma.problem.update({
            where: { id },
            data: {
                isKnownError: true,
                status: "known_error",
                workaround: data.workaround,
            },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "problem",
            entityId: id,
            action: "converted_to_known_error",
            actorId: userId,
            title: `Problem ${problem.ticketNumber} converted to Known Error`,
        });
        return updated;
    }
};
exports.ProblemsService = ProblemsService;
exports.ProblemsService = ProblemsService = ProblemsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tickets_service_1.TicketsService,
        priority_matrix_service_1.PriorityMatrixService,
        sla_calculation_service_1.SLACalculationService,
        activities_service_1.ActivitiesService])
], ProblemsService);
//# sourceMappingURL=problems.service.js.map