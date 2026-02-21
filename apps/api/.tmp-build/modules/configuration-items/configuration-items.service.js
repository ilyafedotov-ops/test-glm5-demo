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
exports.ConfigurationItemsService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("@/prisma/prisma.service");
let ConfigurationItemsService = class ConfigurationItemsService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async findAll(organizationId, query) {
        const where = { organizationId };
        if (query.type)
            where.type = query.type;
        if (query.status)
            where.status = query.status;
        if (query.search) {
            where.name = { contains: query.search, mode: "insensitive" };
        }
        const items = await this.prisma.configurationItem.findMany({
            where,
            include: {
                _count: {
                    select: { incidents: true },
                },
            },
            orderBy: [{ criticality: "desc" }, { name: "asc" }],
        });
        return {
            data: items.map((item) => ({
                ...item,
                linkedIncidentCount: item._count.incidents,
                relationshipCount: this.extractRelationships(item.metadata).length,
            })),
        };
    }
    async findOne(organizationId, id) {
        const item = await this.prisma.configurationItem.findFirst({
            where: { id, organizationId },
            include: {
                incidents: {
                    include: {
                        incident: {
                            select: {
                                id: true,
                                ticketNumber: true,
                                title: true,
                                status: true,
                                priority: true,
                            },
                        },
                    },
                    orderBy: { linkedAt: "desc" },
                    take: 20,
                },
            },
        });
        if (!item) {
            throw new common_1.NotFoundException("Configuration item not found");
        }
        const relationships = await this.findRelationships(organizationId, id);
        return {
            ...item,
            recentIncidents: item.incidents.map((link) => link.incident),
            relationships: relationships.data,
            relationshipCount: relationships.total,
        };
    }
    async create(organizationId, dto) {
        const existing = await this.prisma.configurationItem.findFirst({
            where: {
                organizationId,
                name: dto.name,
            },
        });
        if (existing) {
            throw new common_1.BadRequestException("Configuration item with this name already exists");
        }
        return this.prisma.configurationItem.create({
            data: {
                organizationId,
                name: dto.name,
                type: dto.type || "application",
                status: dto.status || "active",
                criticality: dto.criticality || "medium",
                environment: dto.environment,
                ownerTeam: dto.ownerTeam,
                description: dto.description,
                metadata: dto.metadata || client_1.Prisma.JsonNull,
            },
        });
    }
    async update(organizationId, id, dto) {
        const existing = await this.prisma.configurationItem.findFirst({
            where: { id, organizationId },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Configuration item not found");
        }
        return this.prisma.configurationItem.update({
            where: { id },
            data: {
                name: dto.name,
                type: dto.type,
                status: dto.status,
                criticality: dto.criticality,
                environment: dto.environment,
                ownerTeam: dto.ownerTeam,
                description: dto.description,
                ...(dto.metadata !== undefined
                    ? { metadata: dto.metadata }
                    : {}),
            },
        });
    }
    async remove(organizationId, id) {
        const existing = await this.prisma.configurationItem.findFirst({
            where: { id, organizationId },
            include: {
                _count: {
                    select: { incidents: true },
                },
            },
        });
        if (!existing) {
            throw new common_1.NotFoundException("Configuration item not found");
        }
        if (existing._count.incidents > 0) {
            throw new common_1.BadRequestException("Cannot delete configuration item while linked to incidents. Retire it instead.");
        }
        await this.prisma.configurationItem.delete({
            where: { id },
        });
        return { message: "Configuration item deleted" };
    }
    async findRelationships(organizationId, id) {
        const item = await this.prisma.configurationItem.findFirst({
            where: { id, organizationId },
            select: { id: true, metadata: true },
        });
        if (!item) {
            throw new common_1.NotFoundException("Configuration item not found");
        }
        const relationships = this.extractRelationships(item.metadata);
        const targetIds = Array.from(new Set(relationships.map((relationship) => relationship.targetConfigurationItemId)));
        const targets = targetIds.length
            ? await this.prisma.configurationItem.findMany({
                where: { organizationId, id: { in: targetIds } },
                select: {
                    id: true,
                    name: true,
                    type: true,
                    status: true,
                    criticality: true,
                    environment: true,
                },
            })
            : [];
        const targetsById = new Map(targets.map((target) => [target.id, target]));
        const hydratedRelationships = relationships
            .map((relationship) => ({
            ...relationship,
            target: targetsById.get(relationship.targetConfigurationItemId) || null,
        }))
            .filter((relationship) => relationship.target);
        return {
            data: hydratedRelationships,
            total: hydratedRelationships.length,
        };
    }
    async updateRelationships(organizationId, id, relationships) {
        const item = await this.prisma.configurationItem.findFirst({
            where: { id, organizationId },
            select: { id: true, metadata: true },
        });
        if (!item) {
            throw new common_1.NotFoundException("Configuration item not found");
        }
        const normalizedRelationships = this.normalizeRelationships(relationships, id);
        const targetIds = Array.from(new Set(normalizedRelationships.map((relationship) => relationship.targetConfigurationItemId)));
        if (targetIds.length > 0) {
            const targets = await this.prisma.configurationItem.findMany({
                where: { organizationId, id: { in: targetIds } },
                select: { id: true },
            });
            if (targets.length !== targetIds.length) {
                throw new common_1.BadRequestException("One or more related configuration items are invalid for this organization");
            }
        }
        const metadata = this.toMetadataObject(item.metadata);
        const updatedMetadata = {
            ...metadata,
            relationships: normalizedRelationships,
        };
        await this.prisma.configurationItem.update({
            where: { id },
            data: {
                metadata: updatedMetadata,
            },
        });
        return this.findRelationships(organizationId, id);
    }
    async validateConfigurationItemIds(organizationId, configurationItemIds) {
        const deduped = Array.from(new Set(configurationItemIds.filter(Boolean)));
        if (deduped.length === 0)
            return [];
        const items = await this.prisma.configurationItem.findMany({
            where: {
                organizationId,
                id: { in: deduped },
            },
            select: { id: true },
        });
        if (items.length !== deduped.length) {
            throw new common_1.BadRequestException("One or more configuration items are invalid for this organization");
        }
        return deduped;
    }
    toMetadataObject(metadata) {
        if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
            return metadata;
        }
        return {};
    }
    extractRelationships(metadata) {
        const metadataObject = this.toMetadataObject(metadata);
        const value = metadataObject.relationships;
        if (!Array.isArray(value)) {
            return [];
        }
        return value
            .map((entry) => {
            if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
                return null;
            }
            const record = entry;
            const targetConfigurationItemId = String(record.targetConfigurationItemId || "").trim();
            const relationshipType = String(record.relationshipType || "").trim();
            const note = record.note ? String(record.note) : undefined;
            if (!targetConfigurationItemId || !relationshipType) {
                return null;
            }
            return {
                targetConfigurationItemId,
                relationshipType,
                ...(note ? { note } : {}),
            };
        })
            .filter((entry) => !!entry);
    }
    normalizeRelationships(relationships, sourceConfigurationItemId) {
        const dedupe = new Map();
        for (const relationship of relationships || []) {
            if (relationship.targetConfigurationItemId === sourceConfigurationItemId) {
                throw new common_1.BadRequestException("Configuration item cannot be related to itself");
            }
            const key = `${relationship.relationshipType}|${relationship.targetConfigurationItemId}`;
            if (!dedupe.has(key)) {
                dedupe.set(key, {
                    targetConfigurationItemId: relationship.targetConfigurationItemId,
                    relationshipType: relationship.relationshipType,
                    ...(relationship.note ? { note: relationship.note.trim() } : {}),
                });
            }
        }
        return Array.from(dedupe.values());
    }
};
exports.ConfigurationItemsService = ConfigurationItemsService;
exports.ConfigurationItemsService = ConfigurationItemsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ConfigurationItemsService);
//# sourceMappingURL=configuration-items.service.js.map