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
var ViolationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViolationsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const create_violation_dto_1 = require("./dto/create-violation.dto");
const system_links_1 = require("@/common/system-links/system-links");
let ViolationsService = ViolationsService_1 = class ViolationsService {
    prisma;
    logger = new common_1.Logger(ViolationsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(organizationId, userId, dto) {
        const policy = await this.prisma.policy.findFirst({
            where: { id: dto.policyId, organizationId },
        });
        if (!policy) {
            throw new common_1.NotFoundException(`Policy ${dto.policyId} not found`);
        }
        const violation = await this.prisma.violation.create({
            data: {
                policyId: dto.policyId,
                entityId: dto.entityId,
                entityType: dto.entityType,
                organizationId,
                severity: dto.severity || create_violation_dto_1.ViolationSeverity.MEDIUM,
                title: dto.title,
                description: dto.description,
                remediation: dto.remediation,
                assigneeId: dto.assigneeId,
                status: create_violation_dto_1.ViolationStatus.OPEN,
            },
            include: {
                policy: { select: { name: true } },
            },
        });
        this.logger.log(`Violation created: ${violation.id} for policy ${dto.policyId}`);
        return this.toEntity(violation);
    }
    async findAll(organizationId, query) {
        const { page = 1, limit = 20, status, severity, policyId, assigneeId, entityId, entityType, systemRecordId, search, detectedAfter, detectedBefore, } = query;
        const skip = (page - 1) * limit;
        const parsedSystemRecord = (0, system_links_1.parseSystemRecordId)(systemRecordId);
        const violationIdFromSystemRecord = parsedSystemRecord?.type === "violation" ? parsedSystemRecord.id : undefined;
        const entityIdFromSystemRecord = parsedSystemRecord && parsedSystemRecord.type !== "violation"
            ? parsedSystemRecord.id
            : undefined;
        const entityTypeFromSystemRecord = parsedSystemRecord && parsedSystemRecord.type !== "violation"
            ? parsedSystemRecord.type
            : undefined;
        const where = {
            organizationId,
            ...(status && { status }),
            ...(severity && { severity }),
            ...(policyId && { policyId }),
            ...(assigneeId && { assigneeId }),
            ...(violationIdFromSystemRecord && { id: violationIdFromSystemRecord }),
            ...(entityId && { entityId }),
            ...(entityType && { entityType }),
            ...(entityIdFromSystemRecord && { entityId: entityIdFromSystemRecord }),
            ...(entityTypeFromSystemRecord && { entityType: entityTypeFromSystemRecord }),
            ...(detectedAfter && { detectedAt: { gte: new Date(detectedAfter) } }),
            ...(detectedBefore && { detectedAt: { lte: new Date(detectedBefore) } }),
            ...(search && {
                OR: [
                    { title: { contains: search, mode: "insensitive" } },
                    { description: { contains: search, mode: "insensitive" } },
                ],
            }),
        };
        const [violations, total] = await Promise.all([
            this.prisma.violation.findMany({
                where,
                skip,
                take: limit,
                orderBy: [{ severity: "desc" }, { detectedAt: "desc" }],
                include: {
                    policy: { select: { name: true } },
                },
            }),
            this.prisma.violation.count({ where }),
        ]);
        return {
            data: violations.map((v) => this.toEntity(v)),
            pagination: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(id, organizationId) {
        const violation = await this.prisma.violation.findFirst({
            where: { id, organizationId },
            include: {
                policy: { select: { name: true } },
            },
        });
        if (!violation) {
            throw new common_1.NotFoundException(`Violation ${id} not found`);
        }
        return this.toEntity(violation);
    }
    async update(id, organizationId, userId, dto) {
        const violation = await this.prisma.violation.findFirst({
            where: { id, organizationId },
        });
        if (!violation) {
            throw new common_1.NotFoundException(`Violation ${id} not found`);
        }
        const updated = await this.prisma.violation.update({
            where: { id },
            data: {
                ...dto,
                updatedAt: new Date(),
            },
            include: {
                policy: { select: { name: true } },
            },
        });
        this.logger.log(`Violation updated: ${id} by user ${userId}`);
        return this.toEntity(updated);
    }
    async acknowledge(id, organizationId, userId, dto) {
        const violation = await this.prisma.violation.findFirst({
            where: { id, organizationId },
        });
        if (!violation) {
            throw new common_1.NotFoundException(`Violation ${id} not found`);
        }
        if (violation.status !== create_violation_dto_1.ViolationStatus.OPEN) {
            throw new common_1.BadRequestException("Can only acknowledge open violations");
        }
        const updated = await this.prisma.violation.update({
            where: { id },
            data: {
                status: create_violation_dto_1.ViolationStatus.ACKNOWLEDGED,
                acknowledgedAt: new Date(),
                updatedAt: new Date(),
            },
            include: {
                policy: { select: { name: true } },
            },
        });
        this.logger.log(`Violation acknowledged: ${id} by user ${userId}`);
        return this.toEntity(updated);
    }
    async remediate(id, organizationId, userId, dto) {
        const violation = await this.prisma.violation.findFirst({
            where: { id, organizationId },
        });
        if (!violation) {
            throw new common_1.NotFoundException(`Violation ${id} not found`);
        }
        if (violation.status === create_violation_dto_1.ViolationStatus.REMEDIATED || violation.status === create_violation_dto_1.ViolationStatus.CLOSED) {
            throw new common_1.BadRequestException("Violation is already remediated or closed");
        }
        const updated = await this.prisma.violation.update({
            where: { id },
            data: {
                status: create_violation_dto_1.ViolationStatus.REMEDIATED,
                remediation: dto.remediation,
                remediatedAt: new Date(),
                updatedAt: new Date(),
            },
            include: {
                policy: { select: { name: true } },
            },
        });
        this.logger.log(`Violation remediated: ${id} by user ${userId}`);
        return this.toEntity(updated);
    }
    async assign(id, organizationId, userId, dto) {
        const violation = await this.prisma.violation.findFirst({
            where: { id, organizationId },
        });
        if (!violation) {
            throw new common_1.NotFoundException(`Violation ${id} not found`);
        }
        const assignee = await this.prisma.user.findFirst({
            where: { id: dto.assigneeId, organizationId },
        });
        if (!assignee) {
            throw new common_1.NotFoundException(`User ${dto.assigneeId} not found in organization`);
        }
        const updated = await this.prisma.violation.update({
            where: { id },
            data: {
                assigneeId: dto.assigneeId,
                updatedAt: new Date(),
            },
            include: {
                policy: { select: { name: true } },
            },
        });
        this.logger.log(`Violation assigned: ${id} to user ${dto.assigneeId} by user ${userId}`);
        return this.toEntity(updated);
    }
    async getStats(organizationId) {
        const [total, open, acknowledged, inRemediation, remediated, critical, high] = await Promise.all([
            this.prisma.violation.count({ where: { organizationId } }),
            this.prisma.violation.count({ where: { organizationId, status: create_violation_dto_1.ViolationStatus.OPEN } }),
            this.prisma.violation.count({ where: { organizationId, status: create_violation_dto_1.ViolationStatus.ACKNOWLEDGED } }),
            this.prisma.violation.count({ where: { organizationId, status: create_violation_dto_1.ViolationStatus.IN_REMEDIATION } }),
            this.prisma.violation.count({ where: { organizationId, status: create_violation_dto_1.ViolationStatus.REMEDIATED } }),
            this.prisma.violation.count({ where: { organizationId, severity: create_violation_dto_1.ViolationSeverity.CRITICAL } }),
            this.prisma.violation.count({ where: { organizationId, severity: create_violation_dto_1.ViolationSeverity.HIGH } }),
        ]);
        return { total, open, acknowledged, inRemediation, remediated, critical, high };
    }
    async remove(id, organizationId, userId) {
        const violation = await this.prisma.violation.findFirst({
            where: { id, organizationId },
        });
        if (!violation) {
            throw new common_1.NotFoundException(`Violation ${id} not found`);
        }
        await this.prisma.violation.delete({
            where: { id },
        });
        this.logger.log(`Violation deleted: ${id} by user ${userId}`);
    }
    toEntity(violation) {
        const systemRecordId = (0, system_links_1.toSystemRecordId)("violation", violation.id);
        return {
            id: violation.id,
            policyId: violation.policyId,
            policyName: violation.policy?.name,
            entityId: violation.entityId,
            entityType: violation.entityType,
            status: violation.status,
            severity: violation.severity,
            title: violation.title,
            description: violation.description,
            remediation: violation.remediation,
            assigneeId: violation.assigneeId,
            assigneeName: violation.assignee
                ? `${violation.assignee.firstName} ${violation.assignee.lastName}`
                : undefined,
            organizationId: violation.organizationId,
            detectedAt: violation.detectedAt,
            acknowledgedAt: violation.acknowledgedAt,
            remediatedAt: violation.remediatedAt,
            createdAt: violation.createdAt,
            updatedAt: violation.updatedAt,
            systemRecordId,
            traceContext: (0, system_links_1.toTraceContext)(systemRecordId),
            relatedRecords: (0, system_links_1.buildRelatedRecords)([
                { type: "policy", id: violation.policyId, relationship: "violates_policy" },
                { type: violation.entityType || "entity", id: violation.entityId, relationship: "detected_on_entity" },
            ]),
        };
    }
};
exports.ViolationsService = ViolationsService;
exports.ViolationsService = ViolationsService = ViolationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ViolationsService);
//# sourceMappingURL=violations.service.js.map