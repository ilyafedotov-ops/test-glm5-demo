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
exports.OrganizationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
let OrganizationsService = class OrganizationsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findOne(organizationId) {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });
        if (!org) {
            throw new common_1.NotFoundException("Organization not found");
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
    async update(organizationId, dto) {
        const org = await this.prisma.organization.findUnique({
            where: { id: organizationId },
        });
        if (!org) {
            throw new common_1.NotFoundException("Organization not found");
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
    async getStats(organizationId) {
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
};
exports.OrganizationsService = OrganizationsService;
exports.OrganizationsService = OrganizationsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], OrganizationsService);
//# sourceMappingURL=organizations.service.js.map