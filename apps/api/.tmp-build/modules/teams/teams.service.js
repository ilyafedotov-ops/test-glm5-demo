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
exports.TeamsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
let TeamsService = class TeamsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId) {
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
    async findOne(id, organizationId) {
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
            throw new common_1.NotFoundException(`Team with ID ${id} not found`);
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
    async create(organizationId, userId, dto) {
        if (dto.leadId) {
            const leadUser = await this.prisma.user.findFirst({
                where: { id: dto.leadId, organizationId },
                select: { id: true },
            });
            if (!leadUser) {
                throw new common_1.NotFoundException("Team lead user not found in organization");
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
        const memberIds = new Set(dto.memberIds || []);
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
                throw new common_1.BadRequestException("One or more team members are invalid for this organization");
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
    async update(id, organizationId, dto) {
        const team = await this.prisma.team.findFirst({
            where: { id, organizationId },
        });
        if (!team) {
            throw new common_1.NotFoundException(`Team with ID ${id} not found`);
        }
        if (dto.leadId) {
            const leadUser = await this.prisma.user.findFirst({
                where: { id: dto.leadId, organizationId },
                select: { id: true },
            });
            if (!leadUser) {
                throw new common_1.BadRequestException("Team lead user is invalid for this organization");
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
    async remove(id, organizationId) {
        const team = await this.prisma.team.findFirst({
            where: { id, organizationId },
        });
        if (!team) {
            throw new common_1.NotFoundException(`Team with ID ${id} not found`);
        }
        await this.prisma.team.delete({
            where: { id },
        });
        return { message: "Team deleted successfully" };
    }
    async addMember(teamId, organizationId, dto) {
        const team = await this.prisma.team.findFirst({
            where: { id: teamId, organizationId },
        });
        if (!team) {
            throw new common_1.NotFoundException(`Team with ID ${teamId} not found`);
        }
        const user = await this.prisma.user.findFirst({
            where: { id: dto.userId, organizationId },
        });
        if (!user) {
            throw new common_1.NotFoundException(`User with ID ${dto.userId} not found`);
        }
        const existing = await this.prisma.teamMembership.findUnique({
            where: {
                userId_teamId: {
                    userId: dto.userId,
                    teamId,
                },
            },
        });
        if (existing) {
            throw new common_1.BadRequestException("User is already a member of this team");
        }
        await this.prisma.teamMembership.create({
            data: {
                userId: dto.userId,
                teamId,
            },
        });
        return { message: "Member added successfully" };
    }
    async removeMember(teamId, userId, organizationId) {
        const team = await this.prisma.team.findFirst({
            where: { id: teamId, organizationId },
        });
        if (!team) {
            throw new common_1.NotFoundException(`Team with ID ${teamId} not found`);
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
    async getMembers(teamId, organizationId) {
        const team = await this.prisma.team.findFirst({
            where: { id: teamId, organizationId },
        });
        if (!team) {
            throw new common_1.NotFoundException(`Team with ID ${teamId} not found`);
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
};
exports.TeamsService = TeamsService;
exports.TeamsService = TeamsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TeamsService);
//# sourceMappingURL=teams.service.js.map