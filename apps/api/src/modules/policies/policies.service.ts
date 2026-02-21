import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreatePolicyDto } from "./dto/create-policy.dto";
import { Prisma } from "@prisma/client";
import { CreatePolicyExceptionDto } from "./dto/policy-exception.dto";

@Injectable()
export class PoliciesService {
  constructor(private prisma: PrismaService) {}

  async create(organizationId: string, dto: CreatePolicyDto) {
    let ownerRoleId = dto.ownerRoleId;
    
    if (!ownerRoleId) {
      const adminRole = await this.prisma.role.findUnique({
        where: { name: "admin" },
      });
      ownerRoleId = adminRole?.id || "";
    }

    return this.prisma.policy.create({
      data: {
        name: dto.name,
        description: dto.description,
        category: dto.category,
        status: dto.status || "draft",
        version: dto.version || "1.0",
        effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
        organizationId,
        ownerRoleId,
        reviewFrequencyDays: dto.reviewFrequencyDays || 90,
        nextReviewAt: dto.nextReviewAt 
          ? new Date(dto.nextReviewAt) 
          : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      },
    });
  }

  async findAll(organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [policies, total] = await Promise.all([
      this.prisma.policy.findMany({
        where: { organizationId },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.policy.count({ where: { organizationId } }),
    ]);

    return {
      data: policies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const policy = await this.prisma.policy.findFirst({
      where: { id, organizationId },
      include: {
        violations: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
        exceptions: {
          orderBy: { createdAt: "desc" },
          include: {
            requestedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
            approvedBy: {
              select: { id: true, firstName: true, lastName: true, email: true },
            },
          },
        },
      },
    });

    if (!policy) {
      throw new NotFoundException("Policy not found");
    }

    return policy;
  }

  async update(id: string, organizationId: string, data: Partial<CreatePolicyDto>) {
    const existing = await this.prisma.policy.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException("Policy not found");
    }

    const updateData: Prisma.PolicyUpdateInput = {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.category !== undefined ? { category: data.category } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.version !== undefined ? { version: data.version } : {}),
      ...(data.ownerRoleId !== undefined ? { ownerRoleId: data.ownerRoleId } : {}),
      ...(data.reviewFrequencyDays !== undefined
        ? { reviewFrequencyDays: data.reviewFrequencyDays }
        : {}),
      ...(data.nextReviewAt !== undefined
        ? { nextReviewAt: data.nextReviewAt ? new Date(data.nextReviewAt) : null }
        : {}),
      ...(data.effectiveFrom !== undefined
        ? { effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null }
        : {}),
    };

    return this.prisma.policy.update({
      where: { id },
      data: updateData,
    });
  }

  async listExceptions(policyId: string, organizationId: string) {
    await this.ensurePolicyExists(policyId, organizationId);

    return this.prisma.policyException.findMany({
      where: {
        policyId,
        organizationId,
      },
      orderBy: { createdAt: "desc" },
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async createException(
    policyId: string,
    organizationId: string,
    userId: string,
    dto: CreatePolicyExceptionDto
  ) {
    await this.ensurePolicyExists(policyId, organizationId);

    return this.prisma.policyException.create({
      data: {
        policyId,
        organizationId,
        title: dto.title,
        justification: dto.justification,
        requestedById: userId,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async approveException(
    policyId: string,
    exceptionId: string,
    organizationId: string,
    approverId: string,
    note?: string
  ) {
    const exception = await this.ensureExceptionExists(
      policyId,
      exceptionId,
      organizationId
    );

    if (exception.status !== "requested") {
      throw new BadRequestException("Only requested exceptions can be approved");
    }

    return this.prisma.policyException.update({
      where: { id: exceptionId },
      data: {
        status: "approved",
        approvedAt: new Date(),
        approvedById: approverId,
        justification: note?.trim()
          ? `${exception.justification}\n\nApproval note: ${note.trim()}`
          : exception.justification,
      },
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async rejectException(
    policyId: string,
    exceptionId: string,
    organizationId: string,
    approverId: string,
    note?: string
  ) {
    const exception = await this.ensureExceptionExists(
      policyId,
      exceptionId,
      organizationId
    );

    if (exception.status !== "requested") {
      throw new BadRequestException("Only requested exceptions can be rejected");
    }

    return this.prisma.policyException.update({
      where: { id: exceptionId },
      data: {
        status: "rejected",
        approvedAt: new Date(),
        approvedById: approverId,
        justification: note?.trim()
          ? `${exception.justification}\n\nRejection note: ${note.trim()}`
          : exception.justification,
      },
      include: {
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        approvedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  private async ensurePolicyExists(id: string, organizationId: string) {
    const policy = await this.prisma.policy.findFirst({
      where: { id, organizationId },
      select: { id: true },
    });

    if (!policy) {
      throw new NotFoundException("Policy not found");
    }

    return policy;
  }

  private async ensureExceptionExists(
    policyId: string,
    exceptionId: string,
    organizationId: string
  ) {
    const exception = await this.prisma.policyException.findFirst({
      where: {
        id: exceptionId,
        policyId,
        organizationId,
      },
      select: {
        id: true,
        status: true,
        justification: true,
      },
    });

    if (!exception) {
      throw new NotFoundException("Policy exception not found");
    }

    return exception;
  }
}
