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
exports.PoliciesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma/prisma.service");
let PoliciesService = class PoliciesService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(organizationId, dto) {
        let ownerRoleId = dto.ownerRoleId;
        if (!ownerRoleId) {
            const adminRole = await this.prisma.role.findUnique({
                where: { name: "admin" },
            });
            ownerRoleId = adminRole?.id || "";
        }
        return this.prisma.policy.create({
            data: {
                name: dto.name,
                description: dto.description,
                category: dto.category,
                status: dto.status || "draft",
                version: dto.version || "1.0",
                effectiveFrom: dto.effectiveFrom ? new Date(dto.effectiveFrom) : undefined,
                organizationId,
                ownerRoleId,
                reviewFrequencyDays: dto.reviewFrequencyDays || 90,
                nextReviewAt: dto.nextReviewAt
                    ? new Date(dto.nextReviewAt)
                    : new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
            },
        });
    }
    async findAll(organizationId, page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [policies, total] = await Promise.all([
            this.prisma.policy.findMany({
                where: { organizationId },
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
            }),
            this.prisma.policy.count({ where: { organizationId } }),
        ]);
        return {
            data: policies,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, organizationId) {
        const policy = await this.prisma.policy.findFirst({
            where: { id, organizationId },
            include: {
                violations: {
                    take: 10,
                    orderBy: { createdAt: "desc" },
                },
                exceptions: {
                    orderBy: { createdAt: "desc" },
                    include: {
                        requestedBy: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                        approvedBy: {
                            select: { id: true, firstName: true, lastName: true, email: true },
                        },
                    },
                },
            },
        });
        if (!policy) {
            throw new common_1.NotFoundException("Policy not found");
        }
        return policy;
    }
    async update(id, organizationId, data) {
        const existing = await this.prisma.policy.findFirst({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Policy not found");
        }
        const updateData = {
            ...(data.name !== undefined ? { name: data.name } : {}),
            ...(data.description !== undefined ? { description: data.description } : {}),
            ...(data.category !== undefined ? { category: data.category } : {}),
            ...(data.status !== undefined ? { status: data.status } : {}),
            ...(data.version !== undefined ? { version: data.version } : {}),
            ...(data.ownerRoleId !== undefined ? { ownerRoleId: data.ownerRoleId } : {}),
            ...(data.reviewFrequencyDays !== undefined
                ? { reviewFrequencyDays: data.reviewFrequencyDays }
                : {}),
            ...(data.nextReviewAt !== undefined
                ? { nextReviewAt: data.nextReviewAt ? new Date(data.nextReviewAt) : null }
                : {}),
            ...(data.effectiveFrom !== undefined
                ? { effectiveFrom: data.effectiveFrom ? new Date(data.effectiveFrom) : null }
                : {}),
        };
        return this.prisma.policy.update({
            where: { id },
            data: updateData,
        });
    }
    async listExceptions(policyId, organizationId) {
        await this.ensurePolicyExists(policyId, organizationId);
        return this.prisma.policyException.findMany({
            where: {
                policyId,
                organizationId,
            },
            orderBy: { createdAt: "desc" },
            include: {
                requestedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                approvedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    async createException(policyId, organizationId, userId, dto) {
        await this.ensurePolicyExists(policyId, organizationId);
        return this.prisma.policyException.create({
            data: {
                policyId,
                organizationId,
                title: dto.title,
                justification: dto.justification,
                requestedById: userId,
                expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
            },
            include: {
                requestedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    async approveException(policyId, exceptionId, organizationId, approverId, note) {
        const exception = await this.ensureExceptionExists(policyId, exceptionId, organizationId);
        if (exception.status !== "requested") {
            throw new common_1.BadRequestException("Only requested exceptions can be approved");
        }
        return this.prisma.policyException.update({
            where: { id: exceptionId },
            data: {
                status: "approved",
                approvedAt: new Date(),
                approvedById: approverId,
                justification: note?.trim()
                    ? `${exception.justification}\n\nApproval note: ${note.trim()}`
                    : exception.justification,
            },
            include: {
                requestedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                approvedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    async rejectException(policyId, exceptionId, organizationId, approverId, note) {
        const exception = await this.ensureExceptionExists(policyId, exceptionId, organizationId);
        if (exception.status !== "requested") {
            throw new common_1.BadRequestException("Only requested exceptions can be rejected");
        }
        return this.prisma.policyException.update({
            where: { id: exceptionId },
            data: {
                status: "rejected",
                approvedAt: new Date(),
                approvedById: approverId,
                justification: note?.trim()
                    ? `${exception.justification}\n\nRejection note: ${note.trim()}`
                    : exception.justification,
            },
            include: {
                requestedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
                approvedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
    }
    async ensurePolicyExists(id, organizationId) {
        const policy = await this.prisma.policy.findFirst({
            where: { id, organizationId },
            select: { id: true },
        });
        if (!policy) {
            throw new common_1.NotFoundException("Policy not found");
        }
        return policy;
    }
    async ensureExceptionExists(policyId, exceptionId, organizationId) {
        const exception = await this.prisma.policyException.findFirst({
            where: {
                id: exceptionId,
                policyId,
                organizationId,
            },
            select: {
                id: true,
                status: true,
                justification: true,
            },
        });
        if (!exception) {
            throw new common_1.NotFoundException("Policy exception not found");
        }
        return exception;
    }
};
exports.PoliciesService = PoliciesService;
exports.PoliciesService = PoliciesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PoliciesService);
//# sourceMappingURL=policies.service.js.map