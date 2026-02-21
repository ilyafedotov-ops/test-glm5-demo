import { Injectable, NotFoundException, Logger, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { TicketsService } from "../tickets/tickets.service";
import { ActivitiesService } from "../activities/activities.service";
import { CreateServiceItemDto, CreateServiceRequestDto } from "./dto/service-catalog.dto";
import { Prisma } from "@prisma/client";

const userSummarySelect = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
} as const;

const serviceRequestListInclude = {
  serviceItem: { select: { id: true, name: true, category: true } },
  requester: { select: userSummarySelect },
  assignee: { select: userSummarySelect },
  approvedBy: { select: userSummarySelect },
  deniedBy: { select: userSummarySelect },
  fulfilledBy: { select: userSummarySelect },
} satisfies Prisma.ServiceRequestInclude;

const serviceRequestDetailInclude = {
  serviceItem: true,
  requester: { select: userSummarySelect },
  assignee: { select: userSummarySelect },
  approvedBy: { select: userSummarySelect },
  deniedBy: { select: userSummarySelect },
  fulfilledBy: { select: userSummarySelect },
  lastTransitionBy: { select: userSummarySelect },
  transitions: {
    include: {
      actor: { select: userSummarySelect },
    },
    orderBy: [{ createdAt: "desc" }],
  },
} satisfies Prisma.ServiceRequestInclude;

type ServiceRequestStatus = "requested" | "approved" | "denied" | "fulfilled" | "closed";

@Injectable()
export class ServiceCatalogService {
  private readonly logger = new Logger(ServiceCatalogService.name);

  constructor(
    private prisma: PrismaService,
    private ticketsService: TicketsService,
    private activitiesService: ActivitiesService,
  ) {}

  async createItem(organizationId: string, userId: string, dto: CreateServiceItemDto) {
    const item = await this.prisma.serviceCatalogItem.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        formSchema: dto.formSchema as any,
        approvalRequired: dto.approvalRequired || false,
        organizationId,
      },
    });

    await this.activitiesService.create({
      organizationId,
      entityType: "service_catalog_item",
      entityId: item.id,
      action: "created",
      actorId: userId,
      title: `Service catalog item created: ${item.name}`,
    });

    return item;
  }

  async findAllItems(organizationId: string, category?: string) {
    const where: Prisma.ServiceCatalogItemWhereInput = {
      organizationId,
      status: "active",
    };

    if (category) {
      where["category"] = category;
    }

    return this.prisma.serviceCatalogItem.findMany({
      where,
      include: {
        _count: { select: { serviceRequests: true } },
      },
      orderBy: { name: "asc" },
    });
  }

  async findOneItem(organizationId: string, id: string) {
    const item = await this.prisma.serviceCatalogItem.findFirst({
      where: { id, organizationId },
      include: {
        _count: { select: { serviceRequests: true } },
      },
    });

    if (!item) {
      throw new NotFoundException("Service catalog item not found");
    }

    return item;
  }

  async createRequest(
    organizationId: string,
    userId: string,
    dto: CreateServiceRequestDto
  ) {
    // Verify service item exists
    const item = await this.findOneItem(organizationId, dto.serviceItemId);

    // Generate ticket number
    const ticketNumber = await this.ticketsService.generateTicketNumber(
      organizationId,
      "request"
    );

    const now = new Date();
    const initialStatus: ServiceRequestStatus = item.approvalRequired ? "requested" : "approved";

    const request = await this.prisma.$transaction(async (tx) => {
      const created = await tx.serviceRequest.create({
        data: {
          ticketNumber,
          title: dto.title || `Request for ${item.name}`,
          description: dto.description,
          formData: dto.formData as Prisma.InputJsonValue | undefined,
          serviceItemId: dto.serviceItemId,
          organizationId,
          requesterId: userId,
          status: initialStatus,
          approvedAt: initialStatus === "approved" ? now : undefined,
          approvedById: initialStatus === "approved" ? userId : undefined,
          lastTransitionAt: now,
          lastTransitionById: userId,
        },
        include: serviceRequestDetailInclude,
      });

      await this.recordRequestTransition(tx, {
        organizationId,
        serviceRequestId: created.id,
        actorId: userId,
        fromStatus: null,
        toStatus: initialStatus,
        action: initialStatus === "approved" ? "auto_approved" : "submitted",
        notes:
          initialStatus === "approved"
            ? "Auto-approved because this service item does not require approval"
            : undefined,
        metadata: {
          ticketNumber,
          serviceItemId: item.id,
          serviceItemName: item.name,
        },
      });

      return created;
    });

    await this.activitiesService.create({
      organizationId,
      entityType: "service_request",
      entityId: request.id,
      action: "created",
      actorId: userId,
      title: `Service request ${ticketNumber} created: ${request.title}`,
    });

    return request;
  }

  async findAllRequests(organizationId: string, query: any) {
    const pageRaw = Number.parseInt(String(query.page ?? "1"), 10);
    const limitRaw = Number.parseInt(String(query.limit ?? "20"), 10);
    const page = Number.isNaN(pageRaw) ? 1 : Math.max(1, pageRaw);
    const limit = Number.isNaN(limitRaw) ? 20 : Math.min(100, Math.max(1, limitRaw));
    const skip = (page - 1) * limit;

    const where: Prisma.ServiceRequestWhereInput = { organizationId };
    const statusFilter = query.status;
    const normalizedStatuses = Array.isArray(statusFilter)
      ? statusFilter
      : typeof statusFilter === "string"
        ? statusFilter
            .split(",")
            .map((value) => value.trim())
            .filter(Boolean)
        : [];

    if (normalizedStatuses.length === 1) {
      where["status"] = normalizedStatuses[0];
    } else if (normalizedStatuses.length > 1) {
      where["status"] = { in: normalizedStatuses };
    }

    const [requests, total] = await Promise.all([
      this.prisma.serviceRequest.findMany({
        where,
        skip,
        take: limit,
        include: serviceRequestListInclude,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.serviceRequest.count({ where }),
    ]);

    return {
      data: requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOneRequest(organizationId: string, id: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId },
      include: serviceRequestDetailInclude,
    });

    if (!request) {
      throw new NotFoundException("Service request not found");
    }

    return request;
  }

  async approveRequest(
    organizationId: string,
    id: string,
    userId: string,
    notes?: string
  ) {
    const request = await this.findRequestSummary(organizationId, id);

    if (request.status !== "requested") {
      throw new BadRequestException("Only requested service requests can be approved");
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: "approved",
          approvedAt: now,
          approvedById: userId,
          deniedAt: null,
          deniedById: null,
          denialReason: null,
          lastTransitionAt: now,
          lastTransitionById: userId,
        },
        include: serviceRequestDetailInclude,
      });

      await this.recordRequestTransition(tx, {
        organizationId,
        serviceRequestId: id,
        actorId: userId,
        fromStatus: request.status,
        toStatus: "approved",
        action: "approved",
        notes,
        metadata: {
          ticketNumber: request.ticketNumber,
        },
      });

      return next;
    });

    await this.activitiesService.create({
      organizationId,
      entityType: "service_request",
      entityId: id,
      action: "approved",
      actorId: userId,
      title: `Service request ${request.ticketNumber} approved`,
      description: notes,
    });

    return updated;
  }

  async rejectRequest(
    organizationId: string,
    id: string,
    userId: string,
    reason?: string
  ) {
    const request = await this.findRequestSummary(organizationId, id);

    if (request.status !== "requested") {
      throw new BadRequestException("Only requested service requests can be rejected");
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: "denied",
          deniedAt: now,
          deniedById: userId,
          denialReason: reason ?? null,
          lastTransitionAt: now,
          lastTransitionById: userId,
        },
        include: serviceRequestDetailInclude,
      });

      await this.recordRequestTransition(tx, {
        organizationId,
        serviceRequestId: id,
        actorId: userId,
        fromStatus: request.status,
        toStatus: "denied",
        action: "rejected",
        reason,
        metadata: {
          ticketNumber: request.ticketNumber,
        },
      });

      return next;
    });

    await this.activitiesService.create({
      organizationId,
      entityType: "service_request",
      entityId: id,
      action: "rejected",
      actorId: userId,
      title: `Service request ${request.ticketNumber} rejected`,
      description: reason,
    });

    return updated;
  }

  async fulfillRequest(
    organizationId: string,
    id: string,
    userId: string,
    notes?: string
  ) {
    const request = await this.findRequestSummary(organizationId, id);

    if (request.status !== "approved") {
      throw new BadRequestException("Only approved service requests can be fulfilled");
    }

    const now = new Date();
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.serviceRequest.update({
        where: { id },
        data: {
          status: "fulfilled",
          fulfilledAt: now,
          fulfilledById: userId,
          fulfillmentNotes: notes ?? null,
          lastTransitionAt: now,
          lastTransitionById: userId,
        },
        include: serviceRequestDetailInclude,
      });

      await this.recordRequestTransition(tx, {
        organizationId,
        serviceRequestId: id,
        actorId: userId,
        fromStatus: request.status,
        toStatus: "fulfilled",
        action: "fulfilled",
        notes,
        metadata: {
          ticketNumber: request.ticketNumber,
        },
      });

      return next;
    });

    await this.activitiesService.create({
      organizationId,
      entityType: "service_request",
      entityId: id,
      action: "fulfilled",
      actorId: userId,
      title: `Service request ${request.ticketNumber} fulfilled`,
      description: notes,
    });

    return updated;
  }

  private async findRequestSummary(organizationId: string, id: string) {
    const request = await this.prisma.serviceRequest.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        status: true,
        ticketNumber: true,
        title: true,
      },
    });

    if (!request) {
      throw new NotFoundException("Service request not found");
    }

    return request;
  }

  private async recordRequestTransition(
    tx: Prisma.TransactionClient,
    params: {
      organizationId: string;
      serviceRequestId: string;
      actorId?: string;
      action: string;
      fromStatus?: string | null;
      toStatus: string;
      reason?: string;
      notes?: string;
      metadata?: Record<string, unknown>;
    }
  ) {
    const metadata = this.cleanMetadata(params.metadata);

    await tx.serviceRequestTransition.create({
      data: {
        serviceRequestId: params.serviceRequestId,
        organizationId: params.organizationId,
        actorId: params.actorId,
        action: params.action,
        fromStatus: params.fromStatus,
        toStatus: params.toStatus,
        reason: params.reason,
        notes: params.notes,
        metadata: metadata as Prisma.InputJsonValue | undefined,
      },
    });

    await tx.auditLog.create({
      data: {
        organizationId: params.organizationId,
        actorId: params.actorId,
        actorType: "user",
        action: "service_request_transition",
        resource: "service_request",
        resourceId: params.serviceRequestId,
        previousValue: {
          status: params.fromStatus ?? null,
        },
        newValue: {
          status: params.toStatus,
        },
        metadata: this.cleanMetadata({
          action: params.action,
          reason: params.reason,
          notes: params.notes,
          ...metadata,
        }) as Prisma.InputJsonValue,
        correlationId: `service-request-transition-${params.serviceRequestId}-${Date.now()}`,
      },
    });
  }

  private cleanMetadata(metadata?: Record<string, unknown>) {
    if (!metadata) {
      return undefined;
    }

    const cleaned = Object.entries(metadata).reduce<Record<string, unknown>>(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {}
    );

    return Object.keys(cleaned).length > 0 ? cleaned : undefined;
  }
}
