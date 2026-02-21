import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { CreateRoleDto, UpdateRoleDto } from "./dto/role.dto";

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const roles = await this.prisma.role.findMany({
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
        _count: {
          select: { users: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return roles.map((role) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
      userCount: role._count.users,
    }));
  }

  async findOne(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    };
  }

  async create(dto: CreateRoleDto) {
    // Check if role with same name exists
    const existing = await this.prisma.role.findUnique({
      where: { name: dto.name },
    });

    if (existing) {
      throw new BadRequestException("Role with this name already exists");
    }

    // Create role and assign permissions
    const role = await this.prisma.role.create({
      data: {
        name: dto.name,
        description: dto.description,
        isSystem: false,
        permissions: dto.permissionIds
          ? {
              create: dto.permissionIds.map((permissionId) => ({
                permission: { connect: { id: permissionId } },
              })),
            }
          : undefined,
      },
      include: {
        permissions: {
          include: {
            permission: true,
          },
        },
      },
    });

    return {
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
      permissions: role.permissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    };
  }

  async update(id: string, dto: UpdateRoleDto) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (role.isSystem) {
      throw new BadRequestException("Cannot modify system roles");
    }

    // Update role
    const updated = await this.prisma.$transaction(async (tx) => {
      // Update basic info
      await tx.role.update({
        where: { id },
        data: {
          name: dto.name,
          description: dto.description,
        },
      });

      // Update permissions if provided
      if (dto.permissionIds !== undefined) {
        // Remove existing permissions
        await tx.rolePermission.deleteMany({
          where: { roleId: id },
        });

        // Add new permissions
        if (dto.permissionIds.length > 0) {
          await tx.rolePermission.createMany({
            data: dto.permissionIds.map((permissionId) => ({
              roleId: id,
              permissionId,
            })),
          });
        }
      }

      // Fetch updated role
      return tx.role.findUnique({
        where: { id },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });
    });

    return {
      id: updated!.id,
      name: updated!.name,
      description: updated!.description,
      isSystem: updated!.isSystem,
      permissions: updated!.permissions.map((rp) => ({
        id: rp.permission.id,
        resource: rp.permission.resource,
        action: rp.permission.action,
      })),
    };
  }

  async remove(id: string) {
    const role = await this.prisma.role.findUnique({
      where: { id },
    });

    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    if (role.isSystem) {
      throw new BadRequestException("Cannot delete system roles");
    }

    // Check if any users have this role
    const userCount = await this.prisma.userRole.count({
      where: { roleId: id },
    });

    if (userCount > 0) {
      throw new BadRequestException(
        `Cannot delete role: ${userCount} users are assigned to this role`
      );
    }

    await this.prisma.role.delete({
      where: { id },
    });

    return { message: "Role deleted successfully" };
  }

  async getPermissions() {
    const permissions = await this.prisma.permission.findMany({
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });

    return permissions.map((p) => ({
      id: p.id,
      name: p.name,
      resource: p.resource,
      action: p.action,
    }));
  }
}
