import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreatePrivilegedAccessRequestDto,
  ReviewPrivilegedAccessRequestDto,
  UpdateCabMembersDto,
  UpdateCabPolicyDto,
} from "./dto/admin-governance.dto";

const DEFAULT_CAB_POLICY = {
  minimumApprovers: 2,
  quorumPercent: 60,
  emergencyChangeRequiresCab: true,
  meetingCadence: "weekly",
  maintenanceWindow: "Sun 00:00-04:00 UTC",
};

@Injectable()
export class AdminGovernanceService {
  constructor(private prisma: PrismaService) {}

  async listPrivilegedAccessRequests(organizationId: string, status?: string) {
    const requests = await this.prisma.privilegedAccessRequest.findMany({
      where: {
        organizationId,
        ...(status ? { status } : {}),
      },
      include: {
        targetUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        reviewedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const roleIds = new Set<string>();
    for (const request of requests) {
      request.requestedRoleIds.forEach((id) => roleIds.add(id));
      request.currentRoleIds.forEach((id) => roleIds.add(id));
    }

    const roles = await this.prisma.role.findMany({
      where: { id: { in: Array.from(roleIds) } },
      select: { id: true, name: true, description: true },
    });
    const roleMap = new Map(roles.map((role) => [role.id, role]));

    return requests.map((request) => ({
      id: request.id,
      status: request.status,
      justification: request.justification,
      reviewComment: request.reviewComment,
      createdAt: request.createdAt,
      reviewedAt: request.reviewedAt,
      requestedRoleIds: request.requestedRoleIds,
      currentRoleIds: request.currentRoleIds,
      targetUser: request.targetUser,
      requestedBy: request.requestedBy,
      reviewedBy: request.reviewedBy,
      requestedRoles: request.requestedRoleIds.map((roleId) => roleMap.get(roleId)).filter(Boolean),
      currentRoles: request.currentRoleIds.map((roleId) => roleMap.get(roleId)).filter(Boolean),
    }));
  }

  async createPrivilegedAccessRequest(
    organizationId: string,
    requesterId: string,
    dto: CreatePrivilegedAccessRequestDto
  ) {
    const [targetUser, roles] = await Promise.all([
      this.prisma.user.findFirst({
        where: { id: dto.targetUserId, organizationId },
        include: {
          roles: {
            include: { role: true },
          },
        },
      }),
      this.prisma.role.findMany({
        where: { id: { in: dto.requestedRoleIds } },
        select: { id: true },
      }),
    ]);

    if (!targetUser) {
      throw new NotFoundException("Target user not found in organization");
    }

    if (roles.length !== dto.requestedRoleIds.length) {
      throw new BadRequestException("One or more requested roles are invalid");
    }

    const request = await this.prisma.privilegedAccessRequest.create({
      data: {
        organizationId,
        targetUserId: dto.targetUserId,
        requestedById: requesterId,
        requestedRoleIds: dto.requestedRoleIds,
        currentRoleIds: targetUser.roles.map((userRole) => userRole.roleId),
        justification: dto.justification,
        status: "pending",
      },
    });

    return this.prisma.privilegedAccessRequest.findFirst({
      where: { id: request.id, organizationId },
      include: {
        targetUser: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        requestedBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
      },
    });
  }

  async reviewPrivilegedAccessRequest(
    organizationId: string,
    reviewerId: string,
    requestId: string,
    dto: ReviewPrivilegedAccessRequestDto
  ) {
    const request = await this.prisma.privilegedAccessRequest.findFirst({
      where: { id: requestId, organizationId },
    });

    if (!request) {
      throw new NotFoundException("Privileged access request not found");
    }

    if (request.status !== "pending") {
      throw new BadRequestException("Only pending requests can be reviewed");
    }

    const status = dto.action === "approve" ? "approved" : "rejected";

    const updated = await this.prisma.$transaction(async (tx) => {
      if (status === "approved") {
        await tx.userRole.deleteMany({
          where: { userId: request.targetUserId },
        });

        if (request.requestedRoleIds.length > 0) {
          await tx.userRole.createMany({
            data: request.requestedRoleIds.map((roleId) => ({
              userId: request.targetUserId,
              roleId,
            })),
          });
        }
      }

      return tx.privilegedAccessRequest.update({
        where: { id: request.id },
        data: {
          status,
          reviewComment: dto.comment,
          reviewedById: reviewerId,
          reviewedAt: new Date(),
        },
      });
    });

    return updated;
  }

  async getCabConfiguration(organizationId: string) {
    const policy = await this.ensureCabPolicy(organizationId);
    return this.prisma.cABPolicy.findFirst({
      where: { id: policy.id },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, isActive: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
      },
    });
  }

  async updateCabPolicy(organizationId: string, dto: UpdateCabPolicyDto) {
    return this.prisma.cABPolicy.upsert({
      where: { organizationId },
      update: {
        minimumApprovers: dto.minimumApprovers,
        quorumPercent: dto.quorumPercent,
        emergencyChangeRequiresCab: dto.emergencyChangeRequiresCab,
        meetingCadence: dto.meetingCadence,
        maintenanceWindow: dto.maintenanceWindow,
      },
      create: {
        organizationId,
        minimumApprovers: dto.minimumApprovers ?? DEFAULT_CAB_POLICY.minimumApprovers,
        quorumPercent: dto.quorumPercent ?? DEFAULT_CAB_POLICY.quorumPercent,
        emergencyChangeRequiresCab:
          dto.emergencyChangeRequiresCab ?? DEFAULT_CAB_POLICY.emergencyChangeRequiresCab,
        meetingCadence: dto.meetingCadence ?? DEFAULT_CAB_POLICY.meetingCadence,
        maintenanceWindow: dto.maintenanceWindow ?? DEFAULT_CAB_POLICY.maintenanceWindow,
      },
    });
  }

  async updateCabMembers(organizationId: string, dto: UpdateCabMembersDto) {
    const policy = await this.ensureCabPolicy(organizationId);

    const userIds = dto.members.map((member) => member.userId);
    const users = await this.prisma.user.findMany({
      where: {
        organizationId,
        id: { in: userIds },
      },
      select: { id: true },
    });

    if (users.length !== userIds.length) {
      throw new BadRequestException("One or more CAB members are invalid for this organization");
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.cABMember.deleteMany({
        where: { cabPolicyId: policy.id },
      });

      if (dto.members.length > 0) {
        await tx.cABMember.createMany({
          data: dto.members.map((member) => ({
            cabPolicyId: policy.id,
            userId: member.userId,
            role: member.role,
          })),
        });
      }
    });

    return this.getCabConfiguration(organizationId);
  }

  private async ensureCabPolicy(organizationId: string) {
    return this.prisma.cABPolicy.upsert({
      where: { organizationId },
      update: {},
      create: {
        organizationId,
        ...DEFAULT_CAB_POLICY,
      },
    });
  }
}
