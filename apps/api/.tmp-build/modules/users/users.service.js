"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const bcrypt = __importStar(require("bcrypt"));
const prisma_service_1 = require("../../prisma/prisma.service");
let UsersService = class UsersService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId, page = 1, limit = 20) {
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
    async findOne(id, organizationId) {
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
            throw new common_1.NotFoundException("User not found");
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
    async create(organizationId, dto) {
        const existing = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (existing) {
            throw new common_1.BadRequestException("A user with this email already exists");
        }
        const passwordHash = await bcrypt.hash(dto.password, 10);
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
    async update(id, organizationId, dto) {
        const user = await this.prisma.user.findFirst({
            where: { id, organizationId },
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
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
    async updateRoles(userId, organizationId, roleIds) {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, organizationId },
        });
        if (!user) {
            throw new common_1.NotFoundException("User not found");
        }
        await this.prisma.userRole.deleteMany({
            where: { userId },
        });
        await this.prisma.userRole.createMany({
            data: roleIds.map((roleId) => ({ userId, roleId })),
        });
        return this.findOne(userId, organizationId);
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UsersService);
//# sourceMappingURL=users.service.js.map