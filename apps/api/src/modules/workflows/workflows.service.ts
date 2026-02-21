import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateWorkflowDto, WorkflowStatus, WorkflowType } from "./dto/create-workflow.dto";
import { AdvanceWorkflowDto, CancelWorkflowDto, RollbackWorkflowDto } from "./dto/advance-workflow.dto";
import { WorkflowQueryDto } from "./dto/workflow-query.dto";
import { WorkflowEntity, WorkflowStep } from "./entities/workflow.entity";
import { Prisma } from "@prisma/client";
import {
  buildRelatedRecords,
  parseSystemRecordId,
  toSystemRecordId,
  toTraceContext,
} from "@/common/system-links/system-links";
import { CreateWorkflowFromTemplateDto } from "./dto/create-workflow-from-template.dto";
import {
  WorkflowTemplateDefinition,
  WorkflowTemplateStepDefinition,
  getWorkflowTemplateById,
  listWorkflowTemplates,
  selectIncidentWorkflowTemplate,
} from "./workflow-templates.registry";

@Injectable()
export class WorkflowsService {
  private readonly logger = new Logger(WorkflowsService.name);

  constructor(private prisma: PrismaService) {}

  async listTemplates(caseType?: string) {
    return listWorkflowTemplates(caseType).map((template) => ({
      id: template.id,
      name: template.name,
      description: template.description,
      type: template.type,
      caseType: template.caseType,
      autoAssign: template.autoAssign,
      isActive: template.isActive,
      stepCount: template.steps.length,
      steps: template.steps,
      match: template.match,
    }));
  }

  async create(
    organizationId: string,
    userId: string,
    dto: CreateWorkflowDto
  ): Promise<WorkflowEntity> {
    // Validate steps
    this.validateSteps(dto.steps);

    // Initialize step statuses
    const stepsWithStatus = dto.steps.map((step, index) => ({
      ...step,
      status: index === 0 ? "in_progress" : "pending",
    }));

    // Generate default entityId if not provided
    const entityId = dto.entityId || `workflow-${Date.now()}`;
    const entityType = dto.entityType || "workflow";

    const workflow = await this.prisma.workflow.create({
      data: {
        name: dto.name,
        type: dto.type,
        organizationId,
        entityId,
        entityType,
        incidentId: dto.incidentId,
        status: WorkflowStatus.IN_PROGRESS,
        currentStepId: stepsWithStatus[0]?.id,
        steps: stepsWithStatus as unknown as Prisma.JsonArray,
        context: dto.context || {},
      },
    });

    this.logger.log(`Workflow created: ${workflow.id} by user ${userId}`);
    await this.createWorkflowAuditLog({
      organizationId,
      actorId: userId,
      action: "workflow.create",
      workflow,
      metadata: {
        workflowType: workflow.type,
        entityType: workflow.entityType,
        entityId: workflow.entityId,
      },
    });

    return this.toEntity(workflow);
  }

  async createFromTemplate(
    organizationId: string,
    userId: string,
    dto: CreateWorkflowFromTemplateDto
  ): Promise<WorkflowEntity> {
    const template = getWorkflowTemplateById(dto.templateId);
    if (!template) {
      throw new BadRequestException(`Unknown workflow template: ${dto.templateId}`);
    }

    const templateContext = {
      ...template.defaultContext,
      ...(dto.context || {}),
    } as Record<string, unknown>;

    const steps = this.toWorkflowSteps(template.steps);
    this.validateSteps(steps);

    const stepsWithStatus = steps.map((step, index) => ({
      ...step,
      status: index === 0 ? "in_progress" : "pending",
    }));

    const workflowData = {
      name: dto.name || template.name,
      type: template.type,
      organizationId,
      entityId: dto.entityId || dto.incidentId || `workflow-${Date.now()}`,
      entityType: dto.entityType || template.caseType,
      incidentId: dto.incidentId,
      status: WorkflowStatus.IN_PROGRESS,
      currentStepId: stepsWithStatus[0]?.id,
      steps: stepsWithStatus as unknown as Prisma.JsonArray,
      context: {
        ...templateContext,
        templateId: template.id,
        caseType: template.caseType,
      } as Prisma.InputJsonValue,
    };

    const workflow = await this.prisma.$transaction(async (tx) => {
      const created = await tx.workflow.create({ data: workflowData });

      if (dto.autoCreateTasks !== false) {
        await this.createCorrelatedTasksFromTemplateSteps(tx, {
          organizationId,
          userId,
          workflowId: created.id,
          incidentId: dto.incidentId,
          steps: template.steps,
          template,
          context: templateContext,
        });
      }

      return created;
    });

    this.logger.log(
      `Workflow created from template: ${workflow.id}, template=${template.id}, user=${userId}`
    );

    return this.toEntity(workflow);
  }

  async autoAssignIncidentWorkflowTemplate(
    organizationId: string,
    userId: string,
    incident: {
      id: string;
      title: string;
      ticketNumber?: string | null;
      priority?: string | null;
      status?: string | null;
      channel?: string | null;
      categoryId?: string | null;
      assigneeId?: string | null;
      teamId?: string | null;
    }
  ): Promise<WorkflowEntity | null> {
    const template = selectIncidentWorkflowTemplate({
      priority: incident.priority,
      channel: incident.channel,
      categoryId: incident.categoryId,
    });

    if (!template) {
      return null;
    }

    const context = {
      incident: {
        id: incident.id,
        title: incident.title,
        ticketNumber: incident.ticketNumber,
        priority: incident.priority,
        status: incident.status,
      },
      assigneeId: incident.assigneeId,
      teamId: incident.teamId,
    };

    const workflow = await this.createFromTemplate(organizationId, userId, {
      templateId: template.id,
      incidentId: incident.id,
      entityId: incident.id,
      entityType: "incident",
      context,
      autoCreateTasks: true,
    });

    return workflow;
  }

  async findAll(
    organizationId: string,
    query: WorkflowQueryDto
  ): Promise<{ data: WorkflowEntity[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const { page = 1, limit = 20, status, type, entityId, systemRecordId, incidentId, search } = query;
    const skip = (page - 1) * limit;
    const parsedSystemRecord = parseSystemRecordId(systemRecordId);
    const resolvedEntityId = entityId || parsedSystemRecord?.id;
    const resolvedEntityType = parsedSystemRecord?.type;

    const where: Prisma.WorkflowWhereInput = {
      organizationId,
      ...(status && { status }),
      ...(type && { type }),
      ...(resolvedEntityId && { entityId: resolvedEntityId }),
      ...(resolvedEntityType && { entityType: resolvedEntityType }),
      ...(incidentId && { incidentId }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { type: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [workflows, total] = await Promise.all([
      this.prisma.workflow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.workflow.count({ where }),
    ]);

    return {
      data: workflows.map((w) => this.toEntity(w)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getExceptionAnalytics(organizationId: string) {
    const windowStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const workflows = await this.prisma.workflow.findMany({
      where: {
        organizationId,
        createdAt: { gte: windowStart },
      },
      select: {
        id: true,
        name: true,
        status: true,
        steps: true,
        context: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    const totalWorkflows = workflows.length;
    const failedWorkflows = workflows.filter((workflow) => workflow.status === "failed");
    const cancelledWorkflows = workflows.filter((workflow) => workflow.status === "cancelled");

    let failedSteps = 0;
    let executedSteps = 0;
    let skippedSteps = 0;
    let retrySignals = 0;
    let rollbackSignals = 0;

    const failedStepFrequency = new Map<string, number>();
    const recentExceptions: Array<{
      id: string;
      name: string;
      status: string;
      updatedAt: Date;
      failedSteps: string[];
      reason?: string;
    }> = [];

    for (const workflow of workflows) {
      const steps = this.asWorkflowStepArray(workflow.steps);
      const failedStepNames = steps
        .filter((step) => step.status === "failed")
        .map((step) => step.name);

      failedSteps += failedStepNames.length;
      skippedSteps += steps.filter((step) => step.status === "skipped").length;
      executedSteps += steps.filter((step) =>
        step.status && step.status !== "pending"
      ).length;

      for (const stepName of failedStepNames) {
        failedStepFrequency.set(stepName, (failedStepFrequency.get(stepName) || 0) + 1);
      }

      if (this.hasRetrySignal(workflow.context, steps)) {
        retrySignals += 1;
      }

      const context = this.asObject(workflow.context);
      if (context?.["rolledBackAt"]) {
        rollbackSignals += 1;
      }

      if (workflow.status === "failed" || workflow.status === "cancelled") {
        recentExceptions.push({
          id: workflow.id,
          name: workflow.name,
          status: workflow.status,
          updatedAt: workflow.updatedAt,
          failedSteps: failedStepNames,
          reason:
            this.asString(context?.["cancellationReason"]) ||
            this.asString(context?.["rollbackReason"]),
        });
      }
    }

    return {
      totalWorkflows,
      failedWorkflows: failedWorkflows.length,
      cancelledWorkflows: cancelledWorkflows.length,
      failedSteps,
      skippedSteps,
      rollbackSignals,
      retrySignals,
      stepFailureRatePercent:
        executedSteps > 0 ? Math.round((failedSteps / executedSteps) * 1000) / 10 : 0,
      retrySignalRatePercent:
        totalWorkflows > 0 ? Math.round((retrySignals / totalWorkflows) * 1000) / 10 : 0,
      topFailedSteps: Array.from(failedStepFrequency.entries())
        .map(([stepName, count]) => ({ stepName, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
      recentExceptions: recentExceptions.slice(0, 6),
      windowStart,
    };
  }

  async findOne(id: string, organizationId: string): Promise<WorkflowEntity> {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    return this.toEntity(workflow);
  }

  async advance(
    id: string,
    organizationId: string,
    userId: string,
    dto: AdvanceWorkflowDto
  ): Promise<WorkflowEntity> {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    if (workflow.status === WorkflowStatus.COMPLETED) {
      throw new BadRequestException("Cannot advance a completed workflow");
    }

    if (workflow.status === WorkflowStatus.CANCELLED) {
      throw new BadRequestException("Cannot advance a cancelled workflow");
    }

    const steps = workflow.steps as unknown as WorkflowStep[];
    const currentStepIndex = steps.findIndex((s) => s.id === workflow.currentStepId);

    if (currentStepIndex === -1) {
      throw new BadRequestException("Current step not found in workflow");
    }

    // Update current step based on action
    const action = dto.action || "approve";
    steps[currentStepIndex] = {
      ...steps[currentStepIndex],
      status: action === "approve" ? "completed" : action === "reject" ? "failed" : "skipped",
      completedAt: new Date(),
      completedBy: userId,
      output: dto.data,
    };

    // Determine next step
    let nextStepId: string | null = null;
    let newStatus = workflow.status;

    if (action === "approve" || action === "skip") {
      // Check for explicit next step
      if (dto.nextStepId) {
        nextStepId = dto.nextStepId;
      } else {
        // Default to next sequential step
        const nextStep = steps[currentStepIndex + 1];
        nextStepId = nextStep?.id || null;
      }

      if (nextStepId) {
        const nextStepIndex = steps.findIndex((s) => s.id === nextStepId);
        if (nextStepIndex !== -1) {
          steps[nextStepIndex] = {
            ...steps[nextStepIndex],
            status: "in_progress",
          };
        }
      } else {
        // No more steps, workflow complete
        newStatus = WorkflowStatus.COMPLETED;
      }
    } else if (action === "reject") {
      newStatus = WorkflowStatus.FAILED;
    }

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: {
        currentStepId: nextStepId,
        status: newStatus,
        steps: steps as unknown as Prisma.JsonArray,
        context: dto.data ? { ...(workflow.context as object), ...dto.data } : workflow.context,
        completedAt: newStatus === WorkflowStatus.COMPLETED ? new Date() : null,
      },
    });

    this.logger.log(`Workflow advanced: ${id} by user ${userId}, action: ${action}`);
    await this.createWorkflowAuditLog({
      organizationId,
      actorId: userId,
      action: "workflow.advance",
      workflow: updated,
      metadata: {
        transitionAction: action,
        previousStatus: workflow.status,
        newStatus,
        previousStepId: workflow.currentStepId,
        nextStepId,
      },
    });

    return this.toEntity(updated);
  }

  async cancel(
    id: string,
    organizationId: string,
    userId: string,
    dto: CancelWorkflowDto
  ): Promise<WorkflowEntity> {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    if (workflow.status === WorkflowStatus.COMPLETED) {
      throw new BadRequestException("Cannot cancel a completed workflow");
    }

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: {
        status: WorkflowStatus.CANCELLED,
        context: {
          ...(workflow.context as object),
          cancellationReason: dto.reason,
          cancelledBy: userId,
          cancelledAt: new Date(),
        },
      },
    });

    this.logger.log(`Workflow cancelled: ${id} by user ${userId}`);

    return this.toEntity(updated);
  }

  async rollback(
    id: string,
    organizationId: string,
    userId: string,
    dto: RollbackWorkflowDto
  ): Promise<WorkflowEntity> {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    const steps = workflow.steps as unknown as WorkflowStep[];
    const targetStepIndex = steps.findIndex((s) => s.id === dto.targetStepId);

    if (targetStepIndex === -1) {
      throw new BadRequestException(`Target step ${dto.targetStepId} not found`);
    }

    // Reset all steps from target onwards
    for (let i = targetStepIndex; i < steps.length; i++) {
      steps[i] = {
        ...steps[i],
        status: i === targetStepIndex ? "in_progress" : "pending",
        completedAt: undefined,
        completedBy: undefined,
        output: undefined,
      };
    }

    const updated = await this.prisma.workflow.update({
      where: { id },
      data: {
        currentStepId: dto.targetStepId,
        status: WorkflowStatus.IN_PROGRESS,
        steps: steps as unknown as Prisma.JsonArray,
        context: {
          ...(workflow.context as object),
          rollbackReason: dto.reason,
          rolledBackBy: userId,
          rolledBackAt: new Date(),
        },
      },
    });

    this.logger.log(`Workflow rolled back: ${id} to step ${dto.targetStepId} by user ${userId}`);

    return this.toEntity(updated);
  }

  async remove(id: string, organizationId: string, userId: string): Promise<void> {
    const workflow = await this.prisma.workflow.findFirst({
      where: { id, organizationId },
    });

    if (!workflow) {
      throw new NotFoundException(`Workflow with ID ${id} not found`);
    }

    await this.prisma.workflow.delete({
      where: { id },
    });

    this.logger.log(`Workflow deleted: ${id} by user ${userId}`);
  }

  private validateSteps(steps: any[]): void {
    if (!steps || steps.length === 0) {
      throw new BadRequestException("Workflow must have at least one step");
    }

    const stepIds = steps.map((s) => s.id);
    const uniqueIds = new Set(stepIds);
    if (stepIds.length !== uniqueIds.size) {
      throw new BadRequestException("Step IDs must be unique");
    }

    // Validate nextSteps references exist
    for (const step of steps) {
      if (step.nextSteps) {
        for (const nextId of step.nextSteps) {
          if (!stepIds.includes(nextId)) {
            throw new BadRequestException(`Step ${step.id} references non-existent step ${nextId}`);
          }
        }
      }
    }
  }

  private toWorkflowSteps(steps: WorkflowTemplateStepDefinition[]): WorkflowStep[] {
    return steps.map((step) => ({
      id: step.id,
      name: step.name,
      description: step.description,
      type: step.type,
      assignee: step.assignee,
      config: step.config,
      nextSteps: step.nextSteps,
    }));
  }

  private async createCorrelatedTasksFromTemplateSteps(
    tx: Prisma.TransactionClient,
    params: {
      organizationId: string;
      userId: string;
      workflowId: string;
      incidentId?: string;
      steps: WorkflowTemplateStepDefinition[];
      template: WorkflowTemplateDefinition;
      context: Record<string, unknown>;
    }
  ): Promise<void> {
    const rawAssigneeIds = params.steps
      .map((step) => step.assignee)
      .filter((assignee): assignee is string => this.looksLikeUuid(assignee));

    const assigneePool = new Set<string>(rawAssigneeIds);
    const contextAssigneeId = this.getNestedString(params.context, "assigneeId");
    if (contextAssigneeId && this.looksLikeUuid(contextAssigneeId)) {
      assigneePool.add(contextAssigneeId);
    }

    const validAssignees = assigneePool.size
      ? await tx.user.findMany({
          where: {
            organizationId: params.organizationId,
            id: { in: Array.from(assigneePool) },
          },
          select: { id: true },
        })
      : [];

    const validAssigneeIds = new Set(validAssignees.map((user) => user.id));
    const fallbackAssigneeId = contextAssigneeId && validAssigneeIds.has(contextAssigneeId)
      ? contextAssigneeId
      : undefined;

    const incidentPriority = this.normalizePriority(this.getNestedString(params.context, "incident.priority"));

    const tasks: Prisma.TaskCreateManyInput[] = params.steps.map((step, index) => {
      const assigneeId = step.assignee && validAssigneeIds.has(step.assignee)
        ? step.assignee
        : fallbackAssigneeId;

      const dueAt = this.computeTaskDueDate(step);
      const taskTitle = this.interpolateTemplate(
        step.taskTemplate?.title || `${params.template.name}: ${step.name}`,
        params.context
      );
      const taskDescription = this.interpolateTemplate(
        step.taskTemplate?.description || step.description || "",
        params.context
      );

      return {
        title: taskTitle,
        description: taskDescription || null,
        status: index === 0 ? "in_progress" : "pending",
        priority: step.taskTemplate?.priority || incidentPriority || "medium",
        organizationId: params.organizationId,
        assigneeId,
        reporterId: params.userId,
        incidentId: params.incidentId,
        workflowId: params.workflowId,
        dueAt,
        estimatedMinutes: step.taskTemplate?.estimatedMinutes,
        tags: step.taskTemplate?.tags || ["workflow", "incident"],
        metadata: {
          workflowStepId: step.id,
          workflowStepName: step.name,
          workflowTemplateId: params.template.id,
          workflowTemplateName: params.template.name,
          caseType: params.template.caseType,
          correlationType: "workflow_step_task",
        },
        sourceEntityType: "workflow",
        sourceEntityId: params.workflowId,
      };
    });

    if (tasks.length > 0) {
      await tx.task.createMany({ data: tasks });
    }
  }

  private computeTaskDueDate(step: WorkflowTemplateStepDefinition): Date | undefined {
    const slaMinutesRaw = step.config?.["slaMinutes"];
    const slaMinutes = typeof slaMinutesRaw === "number" ? slaMinutesRaw : step.taskTemplate?.estimatedMinutes;
    if (!slaMinutes || slaMinutes <= 0) {
      return undefined;
    }

    return new Date(Date.now() + slaMinutes * 60000);
  }

  private interpolateTemplate(
    template: string,
    context: Record<string, unknown>
  ): string {
    return template.replace(/\$\{([\w.]+)\}/g, (_, path: string) => {
      const value = this.getNestedString(context, path);
      return value || "";
    }).trim();
  }

  private getNestedString(source: Record<string, unknown>, path: string): string | undefined {
    const segments = path.split(".");
    let current: unknown = source;

    for (const segment of segments) {
      if (!current || typeof current !== "object") {
        return undefined;
      }
      current = (current as Record<string, unknown>)[segment];
    }

    return typeof current === "string" && current.trim().length > 0 ? current : undefined;
  }

  private hasRetrySignal(contextValue: unknown, steps: WorkflowStep[]): boolean {
    const context = this.asObject(contextValue);
    if (context) {
      const retryCount = this.asNumber(context["retryCount"]) ?? this.asNumber(context["retries"]);
      if ((retryCount || 0) > 0) {
        return true;
      }

      if (
        context["retriedStepId"] ||
        context["retryRequested"] === true ||
        context["retry"] === true
      ) {
        return true;
      }
    }

    return steps.some((step) => {
      const output = this.asObject(step.output);
      if (!output) {
        return false;
      }

      const retryCount = this.asNumber(output["retryCount"]) ?? this.asNumber(output["retries"]);
      return (
        (retryCount || 0) > 0 ||
        output["retry"] === true ||
        output["retried"] === true
      );
    });
  }

  private asWorkflowStepArray(value: unknown): WorkflowStep[] {
    if (!Array.isArray(value)) {
      return [];
    }

    return value.filter((step): step is WorkflowStep => !!step && typeof step === "object");
  }

  private asObject(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }

    return value as Record<string, unknown>;
  }

  private asString(value: unknown): string | undefined {
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
  }

  private asNumber(value: unknown): number | undefined {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string" && value.trim().length > 0) {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : undefined;
    }

    return undefined;
  }

  private looksLikeUuid(value?: string): value is string {
    if (!value) {
      return false;
    }

    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
  }

  private normalizePriority(priority?: string): "low" | "medium" | "high" | "critical" | undefined {
    if (!priority) {
      return undefined;
    }

    const normalized = priority.toLowerCase();
    if (normalized === "low" || normalized === "medium" || normalized === "high" || normalized === "critical") {
      return normalized;
    }

    return undefined;
  }

  private toEntity(workflow: any): WorkflowEntity {
    const systemRecordId = toSystemRecordId("workflow", workflow.id);
    return {
      id: workflow.id,
      name: workflow.name,
      type: workflow.type,
      status: workflow.status,
      entityId: workflow.entityId,
      entityType: workflow.entityType,
      organizationId: workflow.organizationId,
      currentStepId: workflow.currentStepId,
      steps: workflow.steps as WorkflowStep[],
      context: workflow.context as Record<string, any>,
      incidentId: workflow.incidentId,
      completedAt: workflow.completedAt,
      createdAt: workflow.createdAt,
      updatedAt: workflow.updatedAt,
      systemRecordId,
      traceContext: toTraceContext(systemRecordId, workflow.context as Record<string, unknown>),
      relatedRecords: buildRelatedRecords([
        { type: "incident", id: workflow.incidentId, relationship: "tracks_incident" },
        { type: workflow.entityType || "entity", id: workflow.entityId, relationship: "targets_entity" },
      ]),
    };
  }

  private async createWorkflowAuditLog(params: {
    organizationId: string;
    actorId: string;
    action: string;
    workflow: {
      id: string;
      status: string;
      type: string;
      entityType?: string | null;
      entityId?: string | null;
    };
    metadata?: Record<string, unknown>;
  }) {
    await this.prisma.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId,
        actorType: "user",
        action: params.action,
        resource: "workflow",
        resourceId: params.workflow.id,
        metadata: {
          workflowId: params.workflow.id,
          workflowStatus: params.workflow.status,
          workflowType: params.workflow.type,
          entityType: params.workflow.entityType ?? null,
          entityId: params.workflow.entityId ?? null,
          ...(params.metadata || {}),
        },
        correlationId: `workflow:${params.workflow.id}:${Date.now()}`,
      },
    });
  }
}
