import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TicketsService } from "../tickets/tickets.service";
import { PriorityMatrixService } from "../sla/priority-matrix.service";
import { SLACalculationService } from "../sla/sla-calculation.service";
import { ActivitiesService } from "../activities/activities.service";
import {
  CreateProblemDto,
  UpdateProblemDto,
  PriorityLevel,
} from "./dto/create-problem.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ProblemsService {
  private readonly logger = new Logger(ProblemsService.name);

  constructor(
    private prisma: PrismaService,
    private ticketsService: TicketsService,
    private priorityMatrix: PriorityMatrixService,
    private slaCalculation: SLACalculationService,
    private activitiesService: ActivitiesService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreateProblemDto) {
    // Generate ticket number
    const ticketNumber = await this.ticketsService.generateTicketNumber(
      organizationId,
      "problem"
    );

    // Calculate priority from impact and urgency
    let priority: PriorityLevel = dto.priority || "medium";
    if (dto.impact && dto.urgency) {
      priority = this.priorityMatrix.calculatePriority(
        dto.impact,
        dto.urgency
      ) as PriorityLevel;
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

    // Link incidents if provided
    if (dto.incidentIds && dto.incidentIds.length > 0) {
      await this.prisma.incident.updateMany({
        where: {
          id: { in: dto.incidentIds },
          organizationId,
        },
        data: { problemId: problem.id },
      });
    }

    // Create activity
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

  async getOptions(organizationId: string) {
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

  async findAll(organizationId: string, query: any) {
    const { page = 1, limit = 20, status, priority, search, isKnownError } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ProblemWhereInput = { organizationId };

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

  async findOne(organizationId: string, id: string) {
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
      throw new NotFoundException("Problem not found");
    }

    return problem;
  }

  async update(
    organizationId: string,
    id: string,
    userId: string,
    dto: UpdateProblemDto
  ) {
    const problem = await this.findOne(organizationId, id);

    // Recalculate priority if impact or urgency changed
    let priority = problem.priority;
    if (dto.impact || dto.urgency) {
      priority = this.priorityMatrix.calculatePriority(
        dto.impact || problem.impact,
        dto.urgency || problem.urgency
      );
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

    // Create activity
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

  async addTask(
    organizationId: string,
    problemId: string,
    userId: string,
    data: { title: string; description?: string; assigneeId?: string }
  ) {
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

  async convertToKnownError(
    organizationId: string,
    id: string,
    userId: string,
    data: { workaround: string }
  ) {
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
}
