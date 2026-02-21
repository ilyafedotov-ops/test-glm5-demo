import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { PrismaService } from "../../prisma/prisma.service";
import { UpdateUserDto } from "./dto/update-user.dto";
import { CreateUserDto } from "./dto/create-user.dto";

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where: { organizationId },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatarUrl: true,
          isActive: true,
          createdAt: true,
          roles: {
            include: {
              role: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      this.prisma.user.count({ where: { organizationId } }),
    ]);

    return {
      data: users.map((u) => ({
        ...u,
        roles: u.roles.map((r) => r.role),
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: skip + limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async findOne(id: string, organizationId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: { permission: true },
                },
              },
            },
          },
        },
        teams: {
          include: { team: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return {
      ...user,
      roles: user.roles.map((r) => ({
        ...r.role,
        permissions: r.role.permissions.map((p) => p.permission),
      })),
      teams: user.teams.map((t) => t.team),
    };
  }

  async create(organizationId: string, dto: CreateUserDto) {
    // Check if email already exists
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException("A user with this email already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        organizationId,
        isActive: true,
        roles: dto.roleIds
          ? {
              create: dto.roleIds.map((roleId) => ({
                role: { connect: { id: roleId } },
              })),
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isActive: true,
        createdAt: true,
        roles: {
          include: {
            role: true,
          },
        },
      },
    });

    return {
      ...user,
      roles: user.roles.map((r) => r.role),
    };
  }

  async update(id: string, organizationId: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findFirst({
      where: { id, organizationId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
        isActive: dto.isActive,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatarUrl: true,
        isActive: true,
      },
    });
  }

  async updateRoles(userId: string, organizationId: string, roleIds: string[]) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw new NotFoundException("User not found");
    }

    await this.prisma.userRole.deleteMany({
      where: { userId },
    });

    await this.prisma.userRole.createMany({
      data: roleIds.map((roleId) => ({ userId, roleId })),
    });

    return this.findOne(userId, organizationId);
  }
}
