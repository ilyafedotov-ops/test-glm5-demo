import { Injectable, NotFoundException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { AuditQueryDto } from "./dto/audit-query.dto";
import { AuditLogEntity, AuditLogDetail, AuditLogDiff } from "./entities/audit-log.entity";
import { Prisma } from "@prisma/client";
import { buildRelatedRecords, toSystemRecordId, toTraceContext } from "@/common/system-links/system-links";

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(
    organizationId: string,
    query: AuditQueryDto
  ): Promise<{ data: AuditLogEntity[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const {
      page = 1,
      limit = 50,
      actorId,
      action,
      resource,
      resourceId,
      correlationId,
      caseType,
      transitionFrom,
      transitionTo,
      fromDate,
      toDate,
      search,
    } = query;
    const skip = (page - 1) * limit;

    const normalizedCaseType = caseType?.trim().toLowerCase();
    const normalizedTransitionFrom = transitionFrom?.trim().toLowerCase();
    const normalizedTransitionTo = transitionTo?.trim().toLowerCase();
    const createdAtFilter: Prisma.DateTimeFilter = {};
    if (fromDate) {
      createdAtFilter.gte = new Date(fromDate);
    }
    if (toDate) {
      createdAtFilter.lte = new Date(toDate);
    }

    const transitionSemanticsRequested = Boolean(
      normalizedCaseType || normalizedTransitionFrom || normalizedTransitionTo
    );
    const andClauses: Prisma.AuditLogWhereInput[] = [];

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

    const where: Prisma.AuditLogWhereInput = {
      organizationId,
      ...(actorId && { actorId }),
      ...(action && { action: { contains: action, mode: "insensitive" } }),
      ...(resource && { resource: { contains: resource, mode: "insensitive" } }),
      ...(resourceId && { resourceId }),
      ...(correlationId && { correlationId }),
      ...(Object.keys(createdAtFilter).length > 0 && { createdAt: createdAtFilter }),
      ...(andClauses.length > 0 && { AND: andClauses }),
    };

    let logs: any[] = [];
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

      const filteredLogs = coarseLogs.filter((log) =>
        this.matchesSemanticFilters(
          log,
          normalizedCaseType,
          normalizedTransitionFrom,
          normalizedTransitionTo
        )
      );

      total = filteredLogs.length;
      logs = filteredLogs.slice(skip, skip + limit);
    } else {
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

  private matchesSemanticFilters(
    log: {
      action: string;
      resource: string;
      metadata?: unknown;
      previousValue?: unknown;
      newValue?: unknown;
    },
    caseType?: string,
    transitionFrom?: string,
    transitionTo?: string
  ): boolean {
    if (caseType) {
      const resource = (log.resource || "").toLowerCase();
      const action = (log.action || "").toLowerCase();
      const metadataCaseType = this.asNormalizedString(
        this.readObjectField(log.metadata, "caseType")
      );
      if (
        resource !== caseType &&
        !resource.includes(caseType) &&
        !action.includes(caseType) &&
        metadataCaseType !== caseType
      ) {
        return false;
      }
    }

    if (transitionFrom) {
      const metaFrom = this.asNormalizedString(
        this.readObjectField(log.metadata, "transitionFrom")
      );
      const prevFrom = this.asNormalizedString(
        this.readObjectField(log.previousValue, "status")
      );
      if (metaFrom !== transitionFrom && prevFrom !== transitionFrom) {
        return false;
      }
    }

    if (transitionTo) {
      const metaTo = this.asNormalizedString(
        this.readObjectField(log.metadata, "transitionTo")
      );
      const nextTo = this.asNormalizedString(
        this.readObjectField(log.newValue, "status")
      );
      if (metaTo !== transitionTo && nextTo !== transitionTo) {
        return false;
      }
    }

    return true;
  }

  private asNormalizedString(value: unknown): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }
    const trimmed = value.trim().toLowerCase();
    return trimmed.length > 0 ? trimmed : undefined;
  }

  private readObjectField(value: unknown, key: string): unknown {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return undefined;
    }

    return (value as Record<string, unknown>)[key];
  }

  async findOne(id: string, organizationId: string): Promise<AuditLogDetail> {
    const log = await this.prisma.auditLog.findFirst({
      where: { id, organizationId },
      include: {
        actor: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!log) {
      throw new NotFoundException(`Audit log ${id} not found`);
    }

    const entity = this.toEntity(log);
    const diffs = this.computeDiffs(log.previousValue, log.newValue);

    return {
      ...entity,
      diffs,
    };
  }

  async getStats(organizationId: string): Promise<{
    totalLogs: number;
    todayCount: number;
    topActions: { action: string; count: number }[];
    topResources: { resource: string; count: number }[];
    topActors: { actorId: string; actorName: string; count: number }[];
  }> {
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

    // Fetch actor names for top actors
    const actorIds = actorGroups.map((g) => g.actorId).filter(Boolean) as string[];
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
        actorName: actorMap.get(g.actorId!) || "System",
        count: g._count.actorId,
      })),
    };
  }

  async exportLogs(
    organizationId: string,
    query: AuditQueryDto
  ): Promise<AuditLogEntity[]> {
    const { data } = await this.findAll(organizationId, { ...query, limit: 10000 });
    return data;
  }

  private computeDiffs(previousValue: any, newValue: any): AuditLogDiff[] {
    const diffs: AuditLogDiff[] = [];

    if (!previousValue && !newValue) {
      return diffs;
    }

    // If only new value, everything is added
    if (!previousValue && newValue) {
      for (const [field, value] of Object.entries(newValue)) {
        diffs.push({ field, newValue: value, changeType: "added" });
      }
      return diffs;
    }

    // If only previous value, everything is removed
    if (previousValue && !newValue) {
      for (const [field, value] of Object.entries(previousValue)) {
        diffs.push({ field, oldValue: value, changeType: "removed" });
      }
      return diffs;
    }

    // Compare both values
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
        } else if (newVal === undefined) {
          diffs.push({ field, oldValue: oldVal, changeType: "removed" });
        } else {
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

  private toEntity(log: any): AuditLogEntity {
    const systemRecordId = toSystemRecordId("audit_log", log.id);
    const resourceType =
      typeof log.resource === "string" && log.resource.trim().length > 0
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
      previousValue: log.previousValue as Record<string, any> | null,
      newValue: log.newValue as Record<string, any> | null,
      metadata: log.metadata as Record<string, any>,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      correlationId: log.correlationId,
      organizationId: log.organizationId,
      createdAt: log.createdAt,
      systemRecordId,
      traceContext: toTraceContext(
        systemRecordId,
        log.metadata as Record<string, unknown>,
        { correlationId: log.correlationId } as Record<string, unknown>
      ),
      relatedRecords: buildRelatedRecords([
        { type: resourceType, id: log.resourceId, relationship: "audit_target" },
      ]),
    };
  }
}
