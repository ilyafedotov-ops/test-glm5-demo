import { Injectable, NotFoundException, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TicketsService } from "../tickets/tickets.service";
import { PriorityMatrixService } from "../sla/priority-matrix.service";
import { ActivitiesService } from "../activities/activities.service";
import { CompleteChangeDto, CreateChangeDto, UpdateChangeDto } from "./dto/create-change.dto";
import { Prisma } from "@prisma/client";

@Injectable()
export class ChangesService {
  private readonly logger = new Logger(ChangesService.name);

  constructor(
    private prisma: PrismaService,
    private ticketsService: TicketsService,
    private priorityMatrix: PriorityMatrixService,
    private activitiesService: ActivitiesService,
  ) {}

  async create(organizationId: string, userId: string, dto: CreateChangeDto) {
    // Generate ticket number
    const ticketNumber = await this.ticketsService.generateTicketNumber(
      organizationId,
      "change"
    );

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

    // Link incidents if provided
    if (dto.incidentIds && dto.incidentIds.length > 0) {
      await this.prisma.incident.updateMany({
        where: {
          id: { in: dto.incidentIds },
          organizationId,
        },
        data: { changeRequestId: changeRequest.id },
      });
    }

    // Create activity
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

  async findAll(organizationId: string, query: any) {
    const { page = 1, limit = 20, status, type, search } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.ChangeRequestWhereInput = { organizationId };

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

  async findOne(organizationId: string, id: string) {
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
      throw new NotFoundException("Change request not found");
    }

    return changeRequest;
  }

  async update(
    organizationId: string,
    id: string,
    userId: string,
    dto: UpdateChangeDto
  ) {
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

    // Create activity
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

  async submitForApproval(organizationId: string, id: string, userId: string) {
    const changeRequest = await this.findOne(organizationId, id);

    if (changeRequest.status !== "draft") {
      throw new BadRequestException("Only draft changes can be submitted for approval");
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

  async approve(
    organizationId: string,
    id: string,
    userId: string,
    comments?: string
  ) {
    const changeRequest = await this.findOne(organizationId, id);

    // Create or update approval
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

    // Check if all required approvals are complete
    const allApprovals = await this.prisma.changeApproval.findMany({
      where: { changeRequestId: id },
    });

    // For now, single approval is enough. In future, this could be configurable
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

  async reject(
    organizationId: string,
    id: string,
    userId: string,
    reason: string
  ) {
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

    // Update change status to rejected
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

  async startImplementation(organizationId: string, id: string, userId: string) {
    const changeRequest = await this.findOne(organizationId, id);

    if (changeRequest.status !== "approved") {
      throw new BadRequestException("Only approved changes can be implemented");
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

  async complete(
    organizationId: string,
    id: string,
    userId: string,
    pir: CompleteChangeDto
  ) {
    const changeRequest = await this.findOne(organizationId, id);

    if (changeRequest.status !== "implementing") {
      throw new BadRequestException("Only changes in implementation can be completed");
    }

    if (!pir?.pirSummary?.trim()) {
      throw new BadRequestException("PIR summary is required to complete a change");
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

    // Close linked incidents
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

  async addTask(
    organizationId: string,
    changeId: string,
    userId: string,
    data: { title: string; description?: string; assigneeId?: string }
  ) {
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
}
