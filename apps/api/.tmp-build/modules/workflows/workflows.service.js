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
var WorkflowsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const create_workflow_dto_1 = require("./dto/create-workflow.dto");
const system_links_1 = require("@/common/system-links/system-links");
const workflow_templates_registry_1 = require("./workflow-templates.registry");
let WorkflowsService = WorkflowsService_1 = class WorkflowsService {
    prisma;
    logger = new common_1.Logger(WorkflowsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async listTemplates(caseType) {
        return (0, workflow_templates_registry_1.listWorkflowTemplates)(caseType).map((template) => ({
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
    async create(organizationId, userId, dto) {
        this.validateSteps(dto.steps);
        const stepsWithStatus = dto.steps.map((step, index) => ({
            ...step,
            status: index === 0 ? "in_progress" : "pending",
        }));
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
                status: create_workflow_dto_1.WorkflowStatus.IN_PROGRESS,
                currentStepId: stepsWithStatus[0]?.id,
                steps: stepsWithStatus,
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
    async createFromTemplate(organizationId, userId, dto) {
        const template = (0, workflow_templates_registry_1.getWorkflowTemplateById)(dto.templateId);
        if (!template) {
            throw new common_1.BadRequestException(`Unknown workflow template: ${dto.templateId}`);
        }
        const templateContext = {
            ...template.defaultContext,
            ...(dto.context || {}),
        };
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
            status: create_workflow_dto_1.WorkflowStatus.IN_PROGRESS,
            currentStepId: stepsWithStatus[0]?.id,
            steps: stepsWithStatus,
            context: {
                ...templateContext,
                templateId: template.id,
                caseType: template.caseType,
            },
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
        this.logger.log(`Workflow created from template: ${workflow.id}, template=${template.id}, user=${userId}`);
        return this.toEntity(workflow);
    }
    async autoAssignIncidentWorkflowTemplate(organizationId, userId, incident) {
        const template = (0, workflow_templates_registry_1.selectIncidentWorkflowTemplate)({
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
    async findAll(organizationId, query) {
        const { page = 1, limit = 20, status, type, entityId, systemRecordId, incidentId, search } = query;
        const skip = (page - 1) * limit;
        const parsedSystemRecord = (0, system_links_1.parseSystemRecordId)(systemRecordId);
        const resolvedEntityId = entityId || parsedSystemRecord?.id;
        const resolvedEntityType = parsedSystemRecord?.type;
        const where = {
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
    async getExceptionAnalytics(organizationId) {
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
        const failedStepFrequency = new Map();
        const recentExceptions = [];
        for (const workflow of workflows) {
            const steps = this.asWorkflowStepArray(workflow.steps);
            const failedStepNames = steps
                .filter((step) => step.status === "failed")
                .map((step) => step.name);
            failedSteps += failedStepNames.length;
            skippedSteps += steps.filter((step) => step.status === "skipped").length;
            executedSteps += steps.filter((step) => step.status && step.status !== "pending").length;
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
                    reason: this.asString(context?.["cancellationReason"]) ||
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
            stepFailureRatePercent: executedSteps > 0 ? Math.round((failedSteps / executedSteps) * 1000) / 10 : 0,
            retrySignalRatePercent: totalWorkflows > 0 ? Math.round((retrySignals / totalWorkflows) * 1000) / 10 : 0,
            topFailedSteps: Array.from(failedStepFrequency.entries())
                .map(([stepName, count]) => ({ stepName, count }))
                .sort((a, b) => b.count - a.count)
                .slice(0, 5),
            recentExceptions: recentExceptions.slice(0, 6),
            windowStart,
        };
    }
    async findOne(id, organizationId) {
        const workflow = await this.prisma.workflow.findFirst({
            where: { id, organizationId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException(`Workflow with ID ${id} not found`);
        }
        return this.toEntity(workflow);
    }
    async advance(id, organizationId, userId, dto) {
        const workflow = await this.prisma.workflow.findFirst({
            where: { id, organizationId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException(`Workflow with ID ${id} not found`);
        }
        if (workflow.status === create_workflow_dto_1.WorkflowStatus.COMPLETED) {
            throw new common_1.BadRequestException("Cannot advance a completed workflow");
        }
        if (workflow.status === create_workflow_dto_1.WorkflowStatus.CANCELLED) {
            throw new common_1.BadRequestException("Cannot advance a cancelled workflow");
        }
        const steps = workflow.steps;
        const currentStepIndex = steps.findIndex((s) => s.id === workflow.currentStepId);
        if (currentStepIndex === -1) {
            throw new common_1.BadRequestException("Current step not found in workflow");
        }
        const action = dto.action || "approve";
        steps[currentStepIndex] = {
            ...steps[currentStepIndex],
            status: action === "approve" ? "completed" : action === "reject" ? "failed" : "skipped",
            completedAt: new Date(),
            completedBy: userId,
            output: dto.data,
        };
        let nextStepId = null;
        let newStatus = workflow.status;
        if (action === "approve" || action === "skip") {
            if (dto.nextStepId) {
                nextStepId = dto.nextStepId;
            }
            else {
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
            }
            else {
                newStatus = create_workflow_dto_1.WorkflowStatus.COMPLETED;
            }
        }
        else if (action === "reject") {
            newStatus = create_workflow_dto_1.WorkflowStatus.FAILED;
        }
        const updated = await this.prisma.workflow.update({
            where: { id },
            data: {
                currentStepId: nextStepId,
                status: newStatus,
                steps: steps,
                context: dto.data ? { ...workflow.context, ...dto.data } : workflow.context,
                completedAt: newStatus === create_workflow_dto_1.WorkflowStatus.COMPLETED ? new Date() : null,
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
    async cancel(id, organizationId, userId, dto) {
        const workflow = await this.prisma.workflow.findFirst({
            where: { id, organizationId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException(`Workflow with ID ${id} not found`);
        }
        if (workflow.status === create_workflow_dto_1.WorkflowStatus.COMPLETED) {
            throw new common_1.BadRequestException("Cannot cancel a completed workflow");
        }
        const updated = await this.prisma.workflow.update({
            where: { id },
            data: {
                status: create_workflow_dto_1.WorkflowStatus.CANCELLED,
                context: {
                    ...workflow.context,
                    cancellationReason: dto.reason,
                    cancelledBy: userId,
                    cancelledAt: new Date(),
                },
            },
        });
        this.logger.log(`Workflow cancelled: ${id} by user ${userId}`);
        return this.toEntity(updated);
    }
    async rollback(id, organizationId, userId, dto) {
        const workflow = await this.prisma.workflow.findFirst({
            where: { id, organizationId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException(`Workflow with ID ${id} not found`);
        }
        const steps = workflow.steps;
        const targetStepIndex = steps.findIndex((s) => s.id === dto.targetStepId);
        if (targetStepIndex === -1) {
            throw new common_1.BadRequestException(`Target step ${dto.targetStepId} not found`);
        }
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
                status: create_workflow_dto_1.WorkflowStatus.IN_PROGRESS,
                steps: steps,
                context: {
                    ...workflow.context,
                    rollbackReason: dto.reason,
                    rolledBackBy: userId,
                    rolledBackAt: new Date(),
                },
            },
        });
        this.logger.log(`Workflow rolled back: ${id} to step ${dto.targetStepId} by user ${userId}`);
        return this.toEntity(updated);
    }
    async remove(id, organizationId, userId) {
        const workflow = await this.prisma.workflow.findFirst({
            where: { id, organizationId },
        });
        if (!workflow) {
            throw new common_1.NotFoundException(`Workflow with ID ${id} not found`);
        }
        await this.prisma.workflow.delete({
            where: { id },
        });
        this.logger.log(`Workflow deleted: ${id} by user ${userId}`);
    }
    validateSteps(steps) {
        if (!steps || steps.length === 0) {
            throw new common_1.BadRequestException("Workflow must have at least one step");
        }
        const stepIds = steps.map((s) => s.id);
        const uniqueIds = new Set(stepIds);
        if (stepIds.length !== uniqueIds.size) {
            throw new common_1.BadRequestException("Step IDs must be unique");
        }
        for (const step of steps) {
            if (step.nextSteps) {
                for (const nextId of step.nextSteps) {
                    if (!stepIds.includes(nextId)) {
                        throw new common_1.BadRequestException(`Step ${step.id} references non-existent step ${nextId}`);
                    }
                }
            }
        }
    }
    toWorkflowSteps(steps) {
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
    async createCorrelatedTasksFromTemplateSteps(tx, params) {
        const rawAssigneeIds = params.steps
            .map((step) => step.assignee)
            .filter((assignee) => this.looksLikeUuid(assignee));
        const assigneePool = new Set(rawAssigneeIds);
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
        const tasks = params.steps.map((step, index) => {
            const assigneeId = step.assignee && validAssigneeIds.has(step.assignee)
                ? step.assignee
                : fallbackAssigneeId;
            const dueAt = this.computeTaskDueDate(step);
            const taskTitle = this.interpolateTemplate(step.taskTemplate?.title || `${params.template.name}: ${step.name}`, params.context);
            const taskDescription = this.interpolateTemplate(step.taskTemplate?.description || step.description || "", params.context);
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
    computeTaskDueDate(step) {
        const slaMinutesRaw = step.config?.["slaMinutes"];
        const slaMinutes = typeof slaMinutesRaw === "number" ? slaMinutesRaw : step.taskTemplate?.estimatedMinutes;
        if (!slaMinutes || slaMinutes <= 0) {
            return undefined;
        }
        return new Date(Date.now() + slaMinutes * 60000);
    }
    interpolateTemplate(template, context) {
        return template.replace(/\$\{([\w.]+)\}/g, (_, path) => {
            const value = this.getNestedString(context, path);
            return value || "";
        }).trim();
    }
    getNestedString(source, path) {
        const segments = path.split(".");
        let current = source;
        for (const segment of segments) {
            if (!current || typeof current !== "object") {
                return undefined;
            }
            current = current[segment];
        }
        return typeof current === "string" && current.trim().length > 0 ? current : undefined;
    }
    hasRetrySignal(contextValue, steps) {
        const context = this.asObject(contextValue);
        if (context) {
            const retryCount = this.asNumber(context["retryCount"]) ?? this.asNumber(context["retries"]);
            if ((retryCount || 0) > 0) {
                return true;
            }
            if (context["retriedStepId"] ||
                context["retryRequested"] === true ||
                context["retry"] === true) {
                return true;
            }
        }
        return steps.some((step) => {
            const output = this.asObject(step.output);
            if (!output) {
                return false;
            }
            const retryCount = this.asNumber(output["retryCount"]) ?? this.asNumber(output["retries"]);
            return ((retryCount || 0) > 0 ||
                output["retry"] === true ||
                output["retried"] === true);
        });
    }
    asWorkflowStepArray(value) {
        if (!Array.isArray(value)) {
            return [];
        }
        return value.filter((step) => !!step && typeof step === "object");
    }
    asObject(value) {
        if (!value || typeof value !== "object" || Array.isArray(value)) {
            return undefined;
        }
        return value;
    }
    asString(value) {
        return typeof value === "string" && value.trim().length > 0 ? value : undefined;
    }
    asNumber(value) {
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === "string" && value.trim().length > 0) {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : undefined;
        }
        return undefined;
    }
    looksLikeUuid(value) {
        if (!value) {
            return false;
        }
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
    }
    normalizePriority(priority) {
        if (!priority) {
            return undefined;
        }
        const normalized = priority.toLowerCase();
        if (normalized === "low" || normalized === "medium" || normalized === "high" || normalized === "critical") {
            return normalized;
        }
        return undefined;
    }
    toEntity(workflow) {
        const systemRecordId = (0, system_links_1.toSystemRecordId)("workflow", workflow.id);
        return {
            id: workflow.id,
            name: workflow.name,
            type: workflow.type,
            status: workflow.status,
            entityId: workflow.entityId,
            entityType: workflow.entityType,
            organizationId: workflow.organizationId,
            currentStepId: workflow.currentStepId,
            steps: workflow.steps,
            context: workflow.context,
            incidentId: workflow.incidentId,
            completedAt: workflow.completedAt,
            createdAt: workflow.createdAt,
            updatedAt: workflow.updatedAt,
            systemRecordId,
            traceContext: (0, system_links_1.toTraceContext)(systemRecordId, workflow.context),
            relatedRecords: (0, system_links_1.buildRelatedRecords)([
                { type: "incident", id: workflow.incidentId, relationship: "tracks_incident" },
                { type: workflow.entityType || "entity", id: workflow.entityId, relationship: "targets_entity" },
            ]),
        };
    }
    async createWorkflowAuditLog(params) {
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
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = WorkflowsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map