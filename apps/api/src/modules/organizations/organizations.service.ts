import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { UpdateOrganizationDto } from "./dto/organization.dto";

@Injectable()
export class OrganizationsService {
  constructor(private prisma: PrismaService) {}

  async findOne(organizationId: string) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      settings: org.settings,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }

  async update(organizationId: string, dto: UpdateOrganizationDto) {
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw new NotFoundException("Organization not found");
    }

    const updated = await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: dto.name,
        settings: dto.settings,
      },
    });

    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      settings: updated.settings,
      updatedAt: updated.updatedAt,
    };
  }

  async getStats(organizationId: string) {
    const [userCount, teamCount, incidentCount, activeIncidents, completedTasks] = await Promise.all([
      this.prisma.user.count({ where: { organizationId } }),
      this.prisma.team.count({ where: { organizationId } }),
      this.prisma.incident.count({ where: { organizationId } }),
      this.prisma.incident.count({
        where: {
          organizationId,
          status: { notIn: ["resolved", "closed"] },
        },
      }),
      this.prisma.task.count({
        where: {
          organizationId,
          status: "completed",
        },
      }),
    ]);

    return {
      userCount,
      teamCount,
      incidentCount,
      activeIncidents,
      completedTasks,
    };
  }
}
