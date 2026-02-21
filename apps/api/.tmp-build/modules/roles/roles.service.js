"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RolesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
let RolesService = class RolesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
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
    async findOne(id) {
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
            throw new common_1.NotFoundException(`Role with ID ${id} not found`);
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
    async create(dto) {
        const existing = await this.prisma.role.findUnique({
            where: { name: dto.name },
        });
        if (existing) {
            throw new common_1.BadRequestException("Role with this name already exists");
        }
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
    async update(id, dto) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${id} not found`);
        }
        if (role.isSystem) {
            throw new common_1.BadRequestException("Cannot modify system roles");
        }
        const updated = await this.prisma.$transaction(async (tx) => {
            await tx.role.update({
                where: { id },
                data: {
                    name: dto.name,
                    description: dto.description,
                },
            });
            if (dto.permissionIds !== undefined) {
                await tx.rolePermission.deleteMany({
                    where: { roleId: id },
                });
                if (dto.permissionIds.length > 0) {
                    await tx.rolePermission.createMany({
                        data: dto.permissionIds.map((permissionId) => ({
                            roleId: id,
                            permissionId,
                        })),
                    });
                }
            }
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
            id: updated.id,
            name: updated.name,
            description: updated.description,
            isSystem: updated.isSystem,
            permissions: updated.permissions.map((rp) => ({
                id: rp.permission.id,
                resource: rp.permission.resource,
                action: rp.permission.action,
            })),
        };
    }
    async remove(id) {
        const role = await this.prisma.role.findUnique({
            where: { id },
        });
        if (!role) {
            throw new common_1.NotFoundException(`Role with ID ${id} not found`);
        }
        if (role.isSystem) {
            throw new common_1.BadRequestException("Cannot delete system roles");
        }
        const userCount = await this.prisma.userRole.count({
            where: { roleId: id },
        });
        if (userCount > 0) {
            throw new common_1.BadRequestException(`Cannot delete role: ${userCount} users are assigned to this role`);
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
};
exports.RolesService = RolesService;
exports.RolesService = RolesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], RolesService);
//# sourceMappingURL=roles.service.js.map