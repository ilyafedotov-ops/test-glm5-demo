import { Injectable, NotFoundException, BadRequestException, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateViolationDto, ViolationStatus, ViolationSeverity } from "./dto/create-violation.dto";
import { UpdateViolationDto, AcknowledgeViolationDto, RemediateViolationDto, AssignViolationDto } from "./dto/update-violation.dto";
import { ViolationQueryDto } from "./dto/violation-query.dto";
import { ViolationEntity, ViolationStats } from "./entities/violation.entity";
import { Prisma } from "@prisma/client";
import {
  buildRelatedRecords,
  parseSystemRecordId,
  toSystemRecordId,
  toTraceContext,
} from "@/common/system-links/system-links";

@Injectable()
export class ViolationsService {
  private readonly logger = new Logger(ViolationsService.name);

  constructor(private prisma: PrismaService) {}

  async create(
    organizationId: string,
    userId: string,
    dto: CreateViolationDto
  ): Promise<ViolationEntity> {
    // Verify policy exists
    const policy = await this.prisma.policy.findFirst({
      where: { id: dto.policyId, organizationId },
    });

    if (!policy) {
      throw new NotFoundException(`Policy ${dto.policyId} not found`);
    }

    const violation = await this.prisma.violation.create({
      data: {
        policyId: dto.policyId,
        entityId: dto.entityId,
        entityType: dto.entityType,
        organizationId,
        severity: dto.severity || ViolationSeverity.MEDIUM,
        title: dto.title,
        description: dto.description,
        remediation: dto.remediation,
        assigneeId: dto.assigneeId,
        status: ViolationStatus.OPEN,
      },
      include: {
        policy: { select: { name: true } },
      } as any,
    });

    this.logger.log(`Violation created: ${violation.id} for policy ${dto.policyId}`);

    // TODO: Trigger notification for assignee if set
    // TODO: Create audit log entry

    return this.toEntity(violation);
  }

  async findAll(
    organizationId: string,
    query: ViolationQueryDto
  ): Promise<{ data: ViolationEntity[]; pagination: { total: number; page: number; limit: number; totalPages: number } }> {
    const {
      page = 1,
      limit = 20,
      status,
      severity,
      policyId,
      assigneeId,
      entityId,
      entityType,
      systemRecordId,
      search,
      detectedAfter,
      detectedBefore,
    } = query;
    const skip = (page - 1) * limit;
    const parsedSystemRecord = parseSystemRecordId(systemRecordId);
    const violationIdFromSystemRecord =
      parsedSystemRecord?.type === "violation" ? parsedSystemRecord.id : undefined;
    const entityIdFromSystemRecord =
      parsedSystemRecord && parsedSystemRecord.type !== "violation"
        ? parsedSystemRecord.id
        : undefined;
    const entityTypeFromSystemRecord =
      parsedSystemRecord && parsedSystemRecord.type !== "violation"
        ? parsedSystemRecord.type
        : undefined;

    const where: Prisma.ViolationWhereInput = {
      organizationId,
      ...(status && { status }),
      ...(severity && { severity }),
      ...(policyId && { policyId }),
      ...(assigneeId && { assigneeId }),
      ...(violationIdFromSystemRecord && { id: violationIdFromSystemRecord }),
      ...(entityId && { entityId }),
      ...(entityType && { entityType }),
      ...(entityIdFromSystemRecord && { entityId: entityIdFromSystemRecord }),
      ...(entityTypeFromSystemRecord && { entityType: entityTypeFromSystemRecord }),
      ...(detectedAfter && { detectedAt: { gte: new Date(detectedAfter) } }),
      ...(detectedBefore && { detectedAt: { lte: new Date(detectedBefore) } }),
      ...(search && {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { description: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [violations, total] = await Promise.all([
      this.prisma.violation.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
        include: {
          policy: { select: { name: true } },
          
        },
      }),
      this.prisma.violation.count({ where }),
    ]);

    return {
      data: violations.map((v) => this.toEntity(v)),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string): Promise<ViolationEntity> {
    const violation = await this.prisma.violation.findFirst({
      where: { id, organizationId },
      include: {
        policy: { select: { name: true } },
        
      },
    });

    if (!violation) {
      throw new NotFoundException(`Violation ${id} not found`);
    }

    return this.toEntity(violation);
  }

  async update(
    id: string,
    organizationId: string,
    userId: string,
    dto: UpdateViolationDto
  ): Promise<ViolationEntity> {
    const violation = await this.prisma.violation.findFirst({
      where: { id, organizationId },
    });

    if (!violation) {
      throw new NotFoundException(`Violation ${id} not found`);
    }

    const updated = await this.prisma.violation.update({
      where: { id },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
      include: {
        policy: { select: { name: true } },
        
      },
    });

    this.logger.log(`Violation updated: ${id} by user ${userId}`);

    return this.toEntity(updated);
  }

  async acknowledge(
    id: string,
    organizationId: string,
    userId: string,
    _dto: AcknowledgeViolationDto
  ): Promise<ViolationEntity> {
    const violation = await this.prisma.violation.findFirst({
      where: { id, organizationId },
    });

    if (!violation) {
      throw new NotFoundException(`Violation ${id} not found`);
    }

    if (violation.status !== ViolationStatus.OPEN) {
      throw new BadRequestException("Can only acknowledge open violations");
    }

    const updated = await this.prisma.violation.update({
      where: { id },
      data: {
        status: ViolationStatus.ACKNOWLEDGED,
        acknowledgedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        policy: { select: { name: true } },
        
      },
    });

    this.logger.log(`Violation acknowledged: ${id} by user ${userId}`);

    return this.toEntity(updated);
  }

  async remediate(
    id: string,
    organizationId: string,
    userId: string,
    dto: RemediateViolationDto
  ): Promise<ViolationEntity> {
    const violation = await this.prisma.violation.findFirst({
      where: { id, organizationId },
    });

    if (!violation) {
      throw new NotFoundException(`Violation ${id} not found`);
    }

    if (violation.status === ViolationStatus.REMEDIATED || violation.status === ViolationStatus.CLOSED) {
      throw new BadRequestException("Violation is already remediated or closed");
    }

    const updated = await this.prisma.violation.update({
      where: { id },
      data: {
        status: ViolationStatus.REMEDIATED,
        remediation: dto.remediation,
        remediatedAt: new Date(),
        updatedAt: new Date(),
      },
      include: {
        policy: { select: { name: true } },
        
      },
    });

    this.logger.log(`Violation remediated: ${id} by user ${userId}`);

    return this.toEntity(updated);
  }

  async assign(
    id: string,
    organizationId: string,
    userId: string,
    dto: AssignViolationDto
  ): Promise<ViolationEntity> {
    const violation = await this.prisma.violation.findFirst({
      where: { id, organizationId },
    });

    if (!violation) {
      throw new NotFoundException(`Violation ${id} not found`);
    }

    // Verify assignee exists in organization
    const assignee = await this.prisma.user.findFirst({
      where: { id: dto.assigneeId, organizationId },
    });

    if (!assignee) {
      throw new NotFoundException(`User ${dto.assigneeId} not found in organization`);
    }

    const updated = await this.prisma.violation.update({
      where: { id },
      data: {
        assigneeId: dto.assigneeId,
        updatedAt: new Date(),
      },
      include: {
        policy: { select: { name: true } },
        
      },
    });

    this.logger.log(`Violation assigned: ${id} to user ${dto.assigneeId} by user ${userId}`);

    return this.toEntity(updated);
  }

  async getStats(organizationId: string): Promise<ViolationStats> {
    const [total, open, acknowledged, inRemediation, remediated, critical, high] = await Promise.all([
      this.prisma.violation.count({ where: { organizationId } }),
      this.prisma.violation.count({ where: { organizationId, status: ViolationStatus.OPEN } }),
      this.prisma.violation.count({ where: { organizationId, status: ViolationStatus.ACKNOWLEDGED } }),
      this.prisma.violation.count({ where: { organizationId, status: ViolationStatus.IN_REMEDIATION } }),
      this.prisma.violation.count({ where: { organizationId, status: ViolationStatus.REMEDIATED } }),
      this.prisma.violation.count({ where: { organizationId, severity: ViolationSeverity.CRITICAL } }),
      this.prisma.violation.count({ where: { organizationId, severity: ViolationSeverity.HIGH } }),
    ]);

    return { total, open, acknowledged, inRemediation, remediated, critical, high };
  }

  async remove(id: string, organizationId: string, userId: string): Promise<void> {
    const violation = await this.prisma.violation.findFirst({
      where: { id, organizationId },
    });

    if (!violation) {
      throw new NotFoundException(`Violation ${id} not found`);
    }

    await this.prisma.violation.delete({
      where: { id },
    });

    this.logger.log(`Violation deleted: ${id} by user ${userId}`);
  }

  private toEntity(violation: any): ViolationEntity {
    const systemRecordId = toSystemRecordId("violation", violation.id);
    return {
      id: violation.id,
      policyId: violation.policyId,
      policyName: violation.policy?.name,
      entityId: violation.entityId,
      entityType: violation.entityType,
      status: violation.status,
      severity: violation.severity,
      title: violation.title,
      description: violation.description,
      remediation: violation.remediation,
      assigneeId: violation.assigneeId,
      assigneeName: violation.assignee
        ? `${violation.assignee.firstName} ${violation.assignee.lastName}`
        : undefined,
      organizationId: violation.organizationId,
      detectedAt: violation.detectedAt,
      acknowledgedAt: violation.acknowledgedAt,
      remediatedAt: violation.remediatedAt,
      createdAt: violation.createdAt,
      updatedAt: violation.updatedAt,
      systemRecordId,
      traceContext: toTraceContext(systemRecordId),
      relatedRecords: buildRelatedRecords([
        { type: "policy", id: violation.policyId, relationship: "violates_policy" },
        { type: violation.entityType || "entity", id: violation.entityId, relationship: "detected_on_entity" },
      ]),
    };
  }
}
