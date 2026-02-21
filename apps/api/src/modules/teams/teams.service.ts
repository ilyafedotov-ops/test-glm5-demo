import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateTeamDto, UpdateTeamDto, AddMemberDto } from "./dto/team.dto";

@Injectable()
export class TeamsService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    const teams = await this.prisma.team.findMany({
      where: { organizationId },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        _count: {
          select: { members: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return {
      data: teams.map((team) => ({
        id: team.id,
        name: team.name,
        description: team.description,
        lead: team.lead,
        memberCount: team._count.members,
        createdAt: team.createdAt,
        updatedAt: team.updatedAt,
      })),
    };
  }

  async findOne(id: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        members: {
          include: {
            user: {
              include: {
                roles: {
                  include: {
                    role: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return {
      id: team.id,
      name: team.name,
      description: team.description,
      lead: team.lead,
      members: team.members.map((m) => ({
        id: m.user.id,
        firstName: m.user.firstName,
        lastName: m.user.lastName,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
        roles: m.user.roles.map((r) => ({ id: r.role.id, name: r.role.name })),
      })),
      createdAt: team.createdAt,
      updatedAt: team.updatedAt,
    };
  }

  async create(organizationId: string, userId: string, dto: CreateTeamDto) {
    if (dto.leadId) {
      const leadUser = await this.prisma.user.findFirst({
        where: { id: dto.leadId, organizationId },
        select: { id: true },
      });

      if (!leadUser) {
        throw new NotFoundException("Team lead user not found in organization");
      }
    }

    const team = await this.prisma.team.create({
      data: {
        name: dto.name,
        description: dto.description,
        organizationId,
        leadId: dto.leadId,
      },
    });

    // Add initial members if provided
    const memberIds = new Set<string>(dto.memberIds || []);
    if (dto.leadId) {
      memberIds.add(dto.leadId);
    }

    if (memberIds.size > 0) {
      const existingUsers = await this.prisma.user.findMany({
        where: {
          organizationId,
          id: { in: Array.from(memberIds) },
        },
        select: { id: true },
      });

      if (existingUsers.length !== memberIds.size) {
        throw new BadRequestException("One or more team members are invalid for this organization");
      }

      await this.prisma.teamMembership.createMany({
        data: Array.from(memberIds).map((memberId) => ({
          teamId: team.id,
          userId: memberId,
        })),
        skipDuplicates: true,
      });
    }

    return this.findOne(team.id, organizationId);
  }

  async update(id: string, organizationId: string, dto: UpdateTeamDto) {
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    if (dto.leadId) {
      const leadUser = await this.prisma.user.findFirst({
        where: { id: dto.leadId, organizationId },
        select: { id: true },
      });

      if (!leadUser) {
        throw new BadRequestException("Team lead user is invalid for this organization");
      }
    }

    const updated = await this.prisma.team.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        leadId: dto.leadId,
      },
      include: {
        lead: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      lead: updated.lead,
      updatedAt: updated.updatedAt,
    };
  }

  async remove(id: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    await this.prisma.team.delete({
      where: { id },
    });

    return { message: "Team deleted successfully" };
  }

  async addMember(teamId: string, organizationId: string, dto: AddMemberDto) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    // Check if user exists in organization
    const user = await this.prisma.user.findFirst({
      where: { id: dto.userId, organizationId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${dto.userId} not found`);
    }

    // Check if already a member
    const existing = await this.prisma.teamMembership.findUnique({
      where: {
        userId_teamId: {
          userId: dto.userId,
          teamId,
        },
      },
    });

    if (existing) {
      throw new BadRequestException("User is already a member of this team");
    }

    await this.prisma.teamMembership.create({
      data: {
        userId: dto.userId,
        teamId,
      },
    });

    return { message: "Member added successfully" };
  }

  async removeMember(teamId: string, userId: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    await this.prisma.teamMembership.delete({
      where: {
        userId_teamId: {
          userId,
          teamId,
        },
      },
    });

    return { message: "Member removed successfully" };
  }

  async getMembers(teamId: string, organizationId: string) {
    const team = await this.prisma.team.findFirst({
      where: { id: teamId, organizationId },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${teamId} not found`);
    }

    const members = await this.prisma.teamMembership.findMany({
      where: { teamId },
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true,
              },
            },
          },
        },
      },
    });

    return members.map((m) => ({
      id: m.user.id,
      firstName: m.user.firstName,
      lastName: m.user.lastName,
      email: m.user.email,
      avatarUrl: m.user.avatarUrl,
      roles: m.user.roles.map((r) => ({ id: r.role.id, name: r.role.name })),
    }));
  }
}
