import { Injectable } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

export interface CreateActivityDto {
  organizationId: string;
  entityType:
    | "incident"
    | "task"
    | "workflow"
    | "violation"
    | "policy"
    | "user"
    | "team"
    | "problem"
    | "change"
    | "knowledge_article"
    | "service_catalog_item"
    | "service_request";
  entityId: string;
  action: string;
  actorId?: string;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateActivityDto) {
    return this.prisma.activity.create({
      data: {
        organizationId: dto.organizationId,
        entityType: dto.entityType,
        entityId: dto.entityId,
        action: dto.action,
        actorId: dto.actorId,
        title: dto.title,
        description: dto.description,
        metadata: dto.metadata || {},
      },
    });
  }

  async findAll(
    organizationId: string,
    options?: {
      entityType?: string;
      entityId?: string;
      actorId?: string;
      action?: string;
      search?: string;
      from?: string;
      to?: string;
      limit?: number;
      offset?: number;
    }
  ) {
    const where: any = { organizationId };

    if (options?.entityType) where.entityType = options.entityType;
    if (options?.entityId) where.entityId = options.entityId;
    if (options?.actorId) where.actorId = options.actorId;
    if (options?.action) where.action = options.action;
    if (options?.from || options?.to) {
      where.createdAt = {};
      if (options?.from) where.createdAt.gte = new Date(options.from);
      if (options?.to) where.createdAt.lte = new Date(options.to);
    }
    if (options?.search) {
      where.OR = [
        { title: { contains: options.search, mode: "insensitive" } },
        { description: { contains: options.search, mode: "insensitive" } },
        { action: { contains: options.search, mode: "insensitive" } },
      ];
    }

    const [activities, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        orderBy: { createdAt: "desc" },
        take: options?.limit || 50,
        skip: options?.offset || 0,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { data: activities, total };
  }

  async getEntityTimeline(
    organizationId: string,
    entityType: string,
    entityId: string
  ) {
    return this.prisma.activity.findMany({
      where: { organizationId, entityType, entityId },
      orderBy: { createdAt: "desc" },
    });
  }

  async getRecentActivity(organizationId: string, limit = 20) {
    return this.prisma.activity.findMany({
      where: { organizationId },
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  }
}
