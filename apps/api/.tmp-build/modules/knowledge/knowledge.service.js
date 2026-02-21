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
var KnowledgeService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KnowledgeService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
const activities_service_1 = require("../activities/activities.service");
let KnowledgeService = KnowledgeService_1 = class KnowledgeService {
    prisma;
    activitiesService;
    logger = new common_1.Logger(KnowledgeService_1.name);
    constructor(prisma, activitiesService) {
        this.prisma = prisma;
        this.activitiesService = activitiesService;
    }
    async create(organizationId, userId, dto) {
        const article = await this.prisma.$transaction(async (tx) => {
            const createdArticle = await tx.knowledgeArticle.create({
                data: {
                    title: dto.title,
                    content: dto.content,
                    category: dto.category,
                    tags: dto.tags || [],
                    authorId: userId,
                    organizationId,
                    status: "draft",
                    version: "1.0",
                },
            });
            await tx.knowledgeArticleVersion.create({
                data: {
                    articleId: createdArticle.id,
                    organizationId,
                    version: createdArticle.version,
                    title: createdArticle.title,
                    content: createdArticle.content,
                    category: createdArticle.category,
                    tags: createdArticle.tags,
                    editedById: userId,
                    changeSummary: "Initial draft",
                },
            });
            return createdArticle;
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "knowledge_article",
            entityId: article.id,
            action: "created",
            actorId: userId,
            title: `Knowledge article created: ${article.title}`,
        });
        return article;
    }
    async findAll(organizationId, query) {
        const { page = 1, limit = 20, category, status, search } = query;
        const skip = (page - 1) * limit;
        const where = { organizationId };
        if (category) {
            where["category"] = category;
        }
        if (status) {
            where["status"] = status;
        }
        if (search) {
            where["OR"] = [
                { title: { contains: search, mode: "insensitive" } },
                { content: { contains: search, mode: "insensitive" } },
            ];
        }
        const [articles, total] = await Promise.all([
            this.prisma.knowledgeArticle.findMany({
                where,
                skip,
                take: limit,
                include: {
                    author: {
                        select: { id: true, firstName: true, lastName: true },
                    },
                },
                orderBy: { updatedAt: "desc" },
            }),
            this.prisma.knowledgeArticle.count({ where }),
        ]);
        return {
            data: articles,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        };
    }
    async findOne(organizationId, id, trackView = true) {
        const article = await this.prisma.knowledgeArticle.findFirst({
            where: { id, organizationId },
            include: {
                author: {
                    select: { id: true, firstName: true, lastName: true, email: true },
                },
            },
        });
        if (!article) {
            throw new common_1.NotFoundException("Knowledge article not found");
        }
        if (trackView) {
            await this.prisma.knowledgeArticle.update({
                where: { id },
                data: { views: { increment: 1 } },
            });
        }
        return article;
    }
    async update(organizationId, id, userId, dto) {
        const article = await this.findOne(organizationId, id, false);
        const nextVersion = this.bumpVersion(article.version);
        const updated = await this.prisma.$transaction(async (tx) => {
            const nextState = await tx.knowledgeArticle.update({
                where: { id },
                data: {
                    title: dto.title ?? article.title,
                    content: dto.content ?? article.content,
                    category: dto.category ?? article.category,
                    tags: dto.tags || article.tags,
                    version: nextVersion,
                },
            });
            await tx.knowledgeArticleVersion.create({
                data: {
                    articleId: article.id,
                    organizationId,
                    version: nextVersion,
                    title: nextState.title,
                    content: nextState.content,
                    category: nextState.category,
                    tags: nextState.tags,
                    editedById: userId,
                    changeSummary: dto.changeSummary || "Content update",
                },
            });
            return nextState;
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "knowledge_article",
            entityId: id,
            action: "updated",
            actorId: userId,
            title: `Knowledge article updated: ${article.title}`,
        });
        return updated;
    }
    async publish(organizationId, id, userId) {
        const article = await this.findOne(organizationId, id, false);
        if (article.status === "published") {
            throw new Error("Article is already published");
        }
        const updated = await this.prisma.knowledgeArticle.update({
            where: { id },
            data: {
                status: "published",
                publishedAt: new Date(),
            },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "knowledge_article",
            entityId: id,
            action: "published",
            actorId: userId,
            title: `Knowledge article published: ${article.title}`,
        });
        return updated;
    }
    async archive(organizationId, id, userId) {
        const article = await this.findOne(organizationId, id, false);
        const updated = await this.prisma.knowledgeArticle.update({
            where: { id },
            data: { status: "archived" },
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "knowledge_article",
            entityId: id,
            action: "archived",
            actorId: userId,
            title: `Knowledge article archived: ${article.title}`,
        });
        return updated;
    }
    async markHelpful(organizationId, id) {
        const article = await this.findOne(organizationId, id, false);
        return this.prisma.knowledgeArticle.update({
            where: { id },
            data: { helpful: { increment: 1 } },
        });
    }
    async markNotHelpful(organizationId, id) {
        const article = await this.findOne(organizationId, id, false);
        return this.prisma.knowledgeArticle.update({
            where: { id },
            data: { notHelpful: { increment: 1 } },
        });
    }
    async search(organizationId, query, limit = 10) {
        return this.prisma.knowledgeArticle.findMany({
            where: {
                organizationId,
                status: "published",
                OR: [
                    { title: { contains: query, mode: "insensitive" } },
                    { content: { contains: query, mode: "insensitive" } },
                    { tags: { has: query } },
                ],
            },
            take: limit,
            orderBy: { views: "desc" },
        });
    }
    async findVersions(organizationId, articleId) {
        await this.findOne(organizationId, articleId, false);
        return this.prisma.knowledgeArticleVersion.findMany({
            where: {
                organizationId,
                articleId,
            },
            include: {
                editedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        });
    }
    async revertToVersion(organizationId, articleId, userId, dto) {
        const article = await this.findOne(organizationId, articleId, false);
        const targetVersion = await this.prisma.knowledgeArticleVersion.findFirst({
            where: {
                id: dto.versionId,
                organizationId,
                articleId,
            },
        });
        if (!targetVersion) {
            throw new common_1.NotFoundException("Knowledge article version not found");
        }
        const nextVersion = this.bumpVersion(article.version);
        const reverted = await this.prisma.$transaction(async (tx) => {
            const nextState = await tx.knowledgeArticle.update({
                where: { id: article.id },
                data: {
                    title: targetVersion.title,
                    content: targetVersion.content,
                    category: targetVersion.category,
                    tags: targetVersion.tags,
                    version: nextVersion,
                    status: "draft",
                },
            });
            await tx.knowledgeArticleVersion.create({
                data: {
                    articleId: article.id,
                    organizationId,
                    version: nextVersion,
                    title: nextState.title,
                    content: nextState.content,
                    category: nextState.category,
                    tags: nextState.tags,
                    editedById: userId,
                    changeSummary: dto.changeSummary || `Reverted from ${article.version} to ${targetVersion.version}`,
                },
            });
            return nextState;
        });
        await this.activitiesService.create({
            organizationId,
            entityType: "knowledge_article",
            entityId: articleId,
            action: "reverted",
            actorId: userId,
            title: `Knowledge article reverted: ${article.title} -> ${targetVersion.version}`,
            description: dto.changeSummary,
            metadata: {
                revertedToVersion: targetVersion.version,
                newVersion: nextVersion,
            },
        });
        return reverted;
    }
    bumpVersion(version) {
        if (!version || !version.includes(".")) {
            return "1.1";
        }
        const [majorRaw, minorRaw] = version.split(".");
        const major = Number(majorRaw);
        const minor = Number(minorRaw);
        if (!Number.isFinite(major) || !Number.isFinite(minor)) {
            return "1.1";
        }
        return `${major}.${minor + 1}`;
    }
};
exports.KnowledgeService = KnowledgeService;
exports.KnowledgeService = KnowledgeService = KnowledgeService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activities_service_1.ActivitiesService])
], KnowledgeService);
//# sourceMappingURL=knowledge.service.js.map