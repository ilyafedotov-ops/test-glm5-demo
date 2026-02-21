import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateTaskDto, TaskStatus, TaskPriority } from "./dto/create-task.dto";
import {
  UpdateTaskDto,
  AssignTaskDto,
  StartTaskDto,
  CompleteTaskDto,
  ReopenTaskDto,
} from "./dto/update-task.dto";
import { TaskQueryDto } from "./dto/task-query.dto";
import { TaskEntity, TaskStats } from "./entities/task.entity";
import { Prisma } from "@prisma/client";
import {
  buildRelatedRecords,
  parseSystemRecordId,
  toSystemRecordId,
  toTraceContext,
} from "@/common/system-links/system-links";
import { ActivitiesService } from "../activities/activities.service";

type TaskRecordOption = {
  id: string;
  label: string;
  subtitle?: string;
  status?: string;
};

type TaskRecordType = "incident" | "workflow" | "violation" | "problem" | "change" | "policy";

@Injectable()
export class TasksService {
  private readonly logger = new Logger(TasksService.name);

  constructor(
    private prisma: PrismaService,
    private activitiesService: ActivitiesService
  ) {}

  async getOptions(organizationId: string) {
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

  async searchRecordOptions(
    organizationId: string,
    type: string,
    query?: string,
    limit = 20
  ): Promise<TaskRecordOption[]> {
    const normalizedType = type.trim().toLowerCase() as TaskRecordType;
    const normalizedQuery = query?.trim();
    const boundedLimit = Math.max(1, Math.min(limit, 50));

    switch (normalizedType) {
      case "incident": {
        const rows = await this.prisma.incident.findMany({
          where: {
            organizationId,
            ...(normalizedQuery
              ? {
                  OR: [
                    { title: { contains: normalizedQuery, mode: "insensitive" } },
                    { ticketNumber: { contains: normalizedQuery, mode: "insensitive" } },
                    { id: { contains: normalizedQuery, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          select: { id: true, title: true, ticketNumber: true, status: true },
          orderBy: { createdAt: "desc" },
          take: boundedLimit,
        });

        return rows.map((row) => ({
          id: row.id,
          label: `${row.ticketNumber || this.toFallbackTicket("INC", row.id)} · ${row.title}`,
          subtitle: `Status: ${row.status}`,
          status: row.status,
        }));
      }

      case "workflow": {
        const rows = await this.prisma.workflow.findMany({
          where: {
            organizationId,
            ...(normalizedQuery
              ? {
                  OR: [
                    { name: { contains: normalizedQuery, mode: "insensitive" } },
                    { type: { contains: normalizedQuery, mode: "insensitive" } },
                    { id: { contains: normalizedQuery, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          select: { id: true, name: true, type: true, status: true },
          orderBy: { updatedAt: "desc" },
          take: boundedLimit,
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.name,
          subtitle: `${row.type} · ${row.status}`,
          status: row.status,
        }));
      }

      case "violation": {
        const rows = await this.prisma.violation.findMany({
          where: {
            organizationId,
            ...(normalizedQuery
              ? {
                  OR: [
                    { title: { contains: normalizedQuery, mode: "insensitive" } },
                    { id: { contains: normalizedQuery, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          select: { id: true, title: true, severity: true, status: true },
          orderBy: { detectedAt: "desc" },
          take: boundedLimit,
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.title,
          subtitle: `${row.severity} severity · ${row.status}`,
          status: row.status,
        }));
      }

      case "problem": {
        const rows = await this.prisma.problem.findMany({
          where: {
            organizationId,
            ...(normalizedQuery
              ? {
                  OR: [
                    { title: { contains: normalizedQuery, mode: "insensitive" } },
                    { ticketNumber: { contains: normalizedQuery, mode: "insensitive" } },
                    { id: { contains: normalizedQuery, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          select: { id: true, title: true, ticketNumber: true, status: true },
          orderBy: { createdAt: "desc" },
          take: boundedLimit,
        });

        return rows.map((row) => ({
          id: row.id,
          label: `${row.ticketNumber || this.toFallbackTicket("PRB", row.id)} · ${row.title}`,
          subtitle: `Status: ${row.status}`,
          status: row.status,
        }));
      }

      case "change": {
        const rows = await this.prisma.changeRequest.findMany({
          where: {
            organizationId,
            ...(normalizedQuery
              ? {
                  OR: [
                    { title: { contains: normalizedQuery, mode: "insensitive" } },
                    { ticketNumber: { contains: normalizedQuery, mode: "insensitive" } },
                    { id: { contains: normalizedQuery, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          select: { id: true, title: true, ticketNumber: true, status: true },
          orderBy: { createdAt: "desc" },
          take: boundedLimit,
        });

        return rows.map((row) => ({
          id: row.id,
          label: `${row.ticketNumber || this.toFallbackTicket("CHG", row.id)} · ${row.title}`,
          subtitle: `Status: ${row.status}`,
          status: row.status,
        }));
      }

      case "policy": {
        const rows = await this.prisma.policy.findMany({
          where: {
            organizationId,
            ...(normalizedQuery
              ? {
                  OR: [
                    { name: { contains: normalizedQuery, mode: "insensitive" } },
                    { id: { contains: normalizedQuery, mode: "insensitive" } },
                  ],
                }
              : {}),
          },
          select: { id: true, name: true, status: true, category: true },
          orderBy: { updatedAt: "desc" },
          take: boundedLimit,
        });

        return rows.map((row) => ({
          id: row.id,
          label: row.name,
          subtitle: `${row.category} · ${row.status}`,
          status: row.status,
        }));
      }

      default:
        throw new BadRequestException(
          "Unsupported type. Use one of: incident, workflow, violation, problem, change, policy."
        );
    }
  }

  async create(organizationId: string, userId: string, dto: CreateTaskDto): Promise<TaskEntity> {
    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status || TaskStatus.PENDING,
        priority: dto.priority || TaskPriority.MEDIUM,
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

    // Create activity
    await this.activitiesService.create({
      organizationId,
      entityType: "task",
      entityId: task.id,
      action: "created",
      actorId: userId,
      title: `Task "${task.title}" created`,
      description: dto.description,
      metadata: {
        priority: dto.priority,
        sourceEntityType: dto.sourceEntityType,
        sourceEntityId: dto.sourceEntityId,
      },
    });

    return this.toEntity(task);
  }

  private toFallbackTicket(prefix: string, id: string): string {
    return `${prefix}-${id.slice(0, 8).toUpperCase()}`;
  }

  async findAll(
    organizationId: string,
    query: TaskQueryDto
  ): Promise<{
    data: TaskEntity[];
    pagination: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 20,
      status,
      priority,
      assigneeId,
      incidentId,
      workflowId,
      teamId,
      violationId,
      policyId,
      sourceEntityId,
      sourceEntityType,
      systemRecordId,
      overdue,
      dueFrom,
      dueTo,
      search,
    } = query;
    const skip = (page - 1) * limit;
    const parsedSystemRecord = parseSystemRecordId(systemRecordId);
    const taskIdFromSystemRecord =
      parsedSystemRecord?.type === "task" ? parsedSystemRecord.id : undefined;

    const now = new Date();

    const where: Prisma.TaskWhereInput = {
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
        status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
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
        orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
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

  async findOne(id: string, organizationId: string): Promise<TaskEntity> {
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
      throw new NotFoundException(`Task ${id} not found`);
    }

    return this.toEntity(task);
  }

  async update(
    id: string,
    organizationId: string,
    userId: string,
    dto: UpdateTaskDto
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
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

  async assign(
    id: string,
    organizationId: string,
    userId: string,
    dto: AssignTaskDto
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    // Verify assignee exists if provided
    if (dto.assigneeId) {
      const assignee = await this.prisma.user.findFirst({
        where: { id: dto.assigneeId, organizationId },
      });
      if (!assignee) {
        throw new NotFoundException(`User ${dto.assigneeId} not found`);
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

    // Create activity
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

  async start(
    id: string,
    organizationId: string,
    userId: string,
    dto: StartTaskDto
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    if (task.status !== TaskStatus.PENDING) {
      throw new BadRequestException("Can only start pending tasks");
    }

    const existingMetadata = (task.metadata as Record<string, unknown>) || {};

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.IN_PROGRESS,
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

    // Create activity
    await this.activitiesService.create({
      organizationId,
      entityType: "task",
      entityId: id,
      action: "started",
      actorId: userId,
      title: `Task "${task.title}" started`,
      description: dto.note,
      metadata: {
        previousStatus: TaskStatus.PENDING,
        newStatus: TaskStatus.IN_PROGRESS,
        ...(dto.note ? { note: dto.note } : {}),
      },
    });

    return this.toEntity(updated);
  }

  async complete(
    id: string,
    organizationId: string,
    userId: string,
    dto: CompleteTaskDto
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    if (task.status === TaskStatus.COMPLETED || task.status === TaskStatus.CANCELLED) {
      throw new BadRequestException("Task is already completed or cancelled");
    }

    const existingMetadata = (task.metadata as Record<string, unknown>) || {};

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.COMPLETED,
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

    // Create activity
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

  async reopen(
    id: string,
    organizationId: string,
    userId: string,
    dto: ReopenTaskDto
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    if (task.status !== TaskStatus.COMPLETED && task.status !== TaskStatus.CANCELLED) {
      throw new BadRequestException("Can only reopen completed or cancelled tasks");
    }

    const existingMetadata = (task.metadata as Record<string, unknown>) || {};

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.PENDING,
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
      metadata: { previousStatus: task.status, newStatus: TaskStatus.PENDING },
    });

    return this.toEntity(updated);
  }

  async cancel(
    id: string,
    organizationId: string,
    userId: string,
    reason?: string
  ): Promise<TaskEntity> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    if (task.status === TaskStatus.COMPLETED) {
      throw new BadRequestException("Cannot cancel a completed task");
    }

    const existingMetadata = (task.metadata as Record<string, unknown>) || {};

    const updated = await this.prisma.task.update({
      where: { id },
      data: {
        status: TaskStatus.CANCELLED,
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
      metadata: { previousStatus: task.status, newStatus: TaskStatus.CANCELLED },
    });

    return this.toEntity(updated);
  }

  async getStats(organizationId: string): Promise<TaskStats> {
    const now = new Date();

    const [total, pending, inProgress, completed, overdue, critical, high, completedTasks] =
      await Promise.all([
        this.prisma.task.count({ where: { organizationId } }),
        this.prisma.task.count({ where: { organizationId, status: TaskStatus.PENDING } }),
        this.prisma.task.count({ where: { organizationId, status: TaskStatus.IN_PROGRESS } }),
        this.prisma.task.count({ where: { organizationId, status: TaskStatus.COMPLETED } }),
        this.prisma.task.count({
          where: {
            organizationId,
            dueAt: { lt: now },
            status: { notIn: [TaskStatus.COMPLETED, TaskStatus.CANCELLED] },
          },
        }),
        this.prisma.task.count({ where: { organizationId, priority: TaskPriority.CRITICAL } }),
        this.prisma.task.count({ where: { organizationId, priority: TaskPriority.HIGH } }),
        this.prisma.task.findMany({
          where: { organizationId, status: TaskStatus.COMPLETED, actualMinutes: { not: null } },
          select: { actualMinutes: true },
        }),
      ]);

    const avgCompletionTime =
      completedTasks.length > 0
        ? completedTasks.reduce((sum, t) => sum + (t.actualMinutes || 0), 0) / completedTasks.length
        : 0;

    return { total, pending, inProgress, completed, overdue, critical, high, avgCompletionTime };
  }

  async remove(id: string, organizationId: string, userId: string): Promise<void> {
    const task = await this.prisma.task.findFirst({
      where: { id, organizationId },
    });

    if (!task) {
      throw new NotFoundException(`Task ${id} not found`);
    }

    await this.prisma.task.delete({
      where: { id },
    });

    this.logger.log(`Task deleted: ${id} by user ${userId}`);
  }

  private toEntity(task: any): TaskEntity {
    const systemRecordId = toSystemRecordId("task", task.id);
    const now = new Date();
    let slaStatus: "on_track" | "at_risk" | "breached" | "completed" = "on_track";
    let timeRemaining: number | undefined;

    if (task.status === TaskStatus.COMPLETED) {
      slaStatus = "completed";
    } else if (task.dueAt) {
      const dueDate = new Date(task.dueAt);
      const diffMinutes = Math.floor((dueDate.getTime() - now.getTime()) / 60000);
      timeRemaining = diffMinutes;

      if (diffMinutes < 0) {
        slaStatus = "breached";
      } else if (diffMinutes < 60) {
        // Less than 1 hour
        slaStatus = "at_risk";
      } else {
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
      metadata: task.metadata as Record<string, any>,
      slaStatus,
      timeRemaining,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      systemRecordId,
      traceContext: toTraceContext(systemRecordId, task.metadata as Record<string, unknown>),
      relatedRecords: buildRelatedRecords([
        { type: "incident", id: task.incidentId, relationship: "belongs_to_incident" },
        { type: "workflow", id: task.workflowId, relationship: "belongs_to_workflow" },
        { type: "violation", id: task.violationId, relationship: "remediates_violation" },
        { type: "policy", id: task.policyId, relationship: "implements_policy_control" },
        {
          type: task.sourceEntityType || "entity",
          id: task.sourceEntityId,
          relationship: "originated_from",
        },
      ]),
    };
  }
}
