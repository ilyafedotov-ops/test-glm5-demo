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
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
let ActivitiesService = class ActivitiesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(dto) {
        return this.prisma.activity.create({
            data: {
                organizationId: dto.organizationId,
                entityType: dto.entityType,
                entityId: dto.entityId,
                action: dto.action,
                actorId: dto.actorId,
                title: dto.title,
                description: dto.description,
                metadata: dto.metadata || {},
            },
        });
    }
    async findAll(organizationId, options) {
        const where = { organizationId };
        if (options?.entityType)
            where.entityType = options.entityType;
        if (options?.entityId)
            where.entityId = options.entityId;
        if (options?.actorId)
            where.actorId = options.actorId;
        if (options?.action)
            where.action = options.action;
        if (options?.from || options?.to) {
            where.createdAt = {};
            if (options?.from)
                where.createdAt.gte = new Date(options.from);
            if (options?.to)
                where.createdAt.lte = new Date(options.to);
        }
        if (options?.search) {
            where.OR = [
                { title: { contains: options.search, mode: "insensitive" } },
                { description: { contains: options.search, mode: "insensitive" } },
                { action: { contains: options.search, mode: "insensitive" } },
            ];
        }
        const [activities, total] = await Promise.all([
            this.prisma.activity.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: options?.limit || 50,
                skip: options?.offset || 0,
            }),
            this.prisma.activity.count({ where }),
        ]);
        return { data: activities, total };
    }
    async getEntityTimeline(organizationId, entityType, entityId) {
        return this.prisma.activity.findMany({
            where: { organizationId, entityType, entityId },
            orderBy: { createdAt: "desc" },
        });
    }
    async getRecentActivity(organizationId, limit = 20) {
        return this.prisma.activity.findMany({
            where: { organizationId },
            orderBy: { createdAt: "desc" },
            take: limit,
        });
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map