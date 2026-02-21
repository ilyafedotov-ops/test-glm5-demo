import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma, ConfigurationItem } from "@prisma/client";
import { PrismaService } from "@/prisma/prisma.service";
import {
  CreateConfigurationItemDto,
  ConfigurationItemRelationshipDto,
  QueryConfigurationItemsDto,
  UpdateConfigurationItemDto,
} from "./dto/configuration-item.dto";

interface StoredConfigurationRelationship {
  targetConfigurationItemId: string;
  relationshipType: string;
  note?: string;
}

@Injectable()
export class ConfigurationItemsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(organizationId: string, query: QueryConfigurationItemsDto) {
    const where: Prisma.ConfigurationItemWhereInput = { organizationId };

    if (query.type) where.type = query.type;
    if (query.status) where.status = query.status;
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

  async findOne(organizationId: string, id: string) {
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
      throw new NotFoundException("Configuration item not found");
    }

    const relationships = await this.findRelationships(organizationId, id);

    return {
      ...item,
      recentIncidents: item.incidents.map((link) => link.incident),
      relationships: relationships.data,
      relationshipCount: relationships.total,
    };
  }

  async create(
    organizationId: string,
    dto: CreateConfigurationItemDto
  ): Promise<ConfigurationItem> {
    const existing = await this.prisma.configurationItem.findFirst({
      where: {
        organizationId,
        name: dto.name,
      },
    });

    if (existing) {
      throw new BadRequestException("Configuration item with this name already exists");
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
        metadata: (dto.metadata as Prisma.InputJsonValue) || Prisma.JsonNull,
      },
    });
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateConfigurationItemDto
  ): Promise<ConfigurationItem> {
    const existing = await this.prisma.configurationItem.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new NotFoundException("Configuration item not found");
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
          ? { metadata: dto.metadata as Prisma.InputJsonValue }
          : {}),
      },
    });
  }

  async remove(organizationId: string, id: string) {
    const existing = await this.prisma.configurationItem.findFirst({
      where: { id, organizationId },
      include: {
        _count: {
          select: { incidents: true },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException("Configuration item not found");
    }

    if (existing._count.incidents > 0) {
      throw new BadRequestException(
        "Cannot delete configuration item while linked to incidents. Retire it instead."
      );
    }

    await this.prisma.configurationItem.delete({
      where: { id },
    });

    return { message: "Configuration item deleted" };
  }

  async findRelationships(organizationId: string, id: string) {
    const item = await this.prisma.configurationItem.findFirst({
      where: { id, organizationId },
      select: { id: true, metadata: true },
    });

    if (!item) {
      throw new NotFoundException("Configuration item not found");
    }

    const relationships = this.extractRelationships(item.metadata);
    const targetIds = Array.from(
      new Set(relationships.map((relationship) => relationship.targetConfigurationItemId))
    );

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

  async updateRelationships(
    organizationId: string,
    id: string,
    relationships: ConfigurationItemRelationshipDto[]
  ) {
    const item = await this.prisma.configurationItem.findFirst({
      where: { id, organizationId },
      select: { id: true, metadata: true },
    });

    if (!item) {
      throw new NotFoundException("Configuration item not found");
    }

    const normalizedRelationships = this.normalizeRelationships(relationships, id);
    const targetIds = Array.from(
      new Set(
        normalizedRelationships.map((relationship) => relationship.targetConfigurationItemId)
      )
    );

    if (targetIds.length > 0) {
      const targets = await this.prisma.configurationItem.findMany({
        where: { organizationId, id: { in: targetIds } },
        select: { id: true },
      });

      if (targets.length !== targetIds.length) {
        throw new BadRequestException(
          "One or more related configuration items are invalid for this organization"
        );
      }
    }

    const metadata = this.toMetadataObject(item.metadata);
    const updatedMetadata: Prisma.InputJsonObject = {
      ...metadata,
      relationships: normalizedRelationships as unknown as Prisma.InputJsonValue,
    };

    await this.prisma.configurationItem.update({
      where: { id },
      data: {
        metadata: updatedMetadata,
      },
    });

    return this.findRelationships(organizationId, id);
  }

  async validateConfigurationItemIds(
    organizationId: string,
    configurationItemIds: string[]
  ): Promise<string[]> {
    const deduped = Array.from(new Set(configurationItemIds.filter(Boolean)));
    if (deduped.length === 0) return [];

    const items = await this.prisma.configurationItem.findMany({
      where: {
        organizationId,
        id: { in: deduped },
      },
      select: { id: true },
    });

    if (items.length !== deduped.length) {
      throw new BadRequestException(
        "One or more configuration items are invalid for this organization"
      );
    }

    return deduped;
  }

  private toMetadataObject(
    metadata: Prisma.JsonValue | null
  ): Record<string, unknown> {
    if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
      return metadata as Record<string, unknown>;
    }

    return {};
  }

  private extractRelationships(
    metadata: Prisma.JsonValue | null
  ): StoredConfigurationRelationship[] {
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

        const record = entry as Record<string, unknown>;
        const targetConfigurationItemId = String(
          record.targetConfigurationItemId || ""
        ).trim();
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
      .filter((entry): entry is StoredConfigurationRelationship => !!entry);
  }

  private normalizeRelationships(
    relationships: ConfigurationItemRelationshipDto[],
    sourceConfigurationItemId: string
  ): StoredConfigurationRelationship[] {
    const dedupe = new Map<string, StoredConfigurationRelationship>();

    for (const relationship of relationships || []) {
      if (relationship.targetConfigurationItemId === sourceConfigurationItemId) {
        throw new BadRequestException(
          "Configuration item cannot be related to itself"
        );
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
}
