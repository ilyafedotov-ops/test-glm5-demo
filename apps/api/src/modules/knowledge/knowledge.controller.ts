import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { Audited } from "@/modules/audit/decorators/audited.decorator";
import { KnowledgeService } from "./knowledge.service";
import {
  CreateKnowledgeArticleDto,
  RevertKnowledgeArticleVersionDto,
  UpdateKnowledgeArticleDto,
} from "./dto/knowledge.dto";

@ApiTags("knowledge")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("knowledge:read")
@Controller("knowledge")
export class KnowledgeController {
  constructor(private readonly knowledgeService: KnowledgeService) {}

  @Post()
  @ApiOperation({ summary: "Create a knowledge article" })
  @RequirePermissions("knowledge:write")
  @Audited({
    action: "knowledge.create",
    resource: "knowledgeArticle",
    captureNewValue: true,
  })
  create(@Request() req: any, @Body() dto: CreateKnowledgeArticleDto) {
    return this.knowledgeService.create(
      req.user.organizationId,
      req.user.userId,
      dto
    );
  }

  @Get()
  @ApiOperation({ summary: "List all knowledge articles" })
  findAll(@Request() req: any, @Query() query: any) {
    return this.knowledgeService.findAll(req.user.organizationId, query);
  }

  @Get("search")
  @ApiOperation({ summary: "Search knowledge articles" })
  search(
    @Request() req: any,
    @Query("q") query: string,
    @Query("limit") limit?: string
  ) {
    return this.knowledgeService.search(
      req.user.organizationId,
      query,
      limit ? parseInt(limit) : 10
    );
  }

  @Get(":id")
  @ApiOperation({ summary: "Get knowledge article details" })
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.knowledgeService.findOne(req.user.organizationId, id);
  }

  @Get(":id/versions")
  @ApiOperation({ summary: "List article version history" })
  findVersions(@Request() req: any, @Param("id") id: string) {
    return this.knowledgeService.findVersions(req.user.organizationId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update knowledge article" })
  @RequirePermissions("knowledge:update")
  @Audited({
    action: "knowledge.update",
    resource: "knowledgeArticle",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  update(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: UpdateKnowledgeArticleDto
  ) {
    return this.knowledgeService.update(
      req.user.organizationId,
      id,
      req.user.userId,
      dto
    );
  }

  @Post(":id/publish")
  @ApiOperation({ summary: "Publish knowledge article" })
  @RequirePermissions("knowledge:update")
  @Audited({
    action: "knowledge.publish",
    resource: "knowledgeArticle",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  publish(@Request() req: any, @Param("id") id: string) {
    return this.knowledgeService.publish(
      req.user.organizationId,
      id,
      req.user.userId
    );
  }

  @Post(":id/archive")
  @ApiOperation({ summary: "Archive knowledge article" })
  @RequirePermissions("knowledge:update")
  @Audited({
    action: "knowledge.archive",
    resource: "knowledgeArticle",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  archive(@Request() req: any, @Param("id") id: string) {
    return this.knowledgeService.archive(
      req.user.organizationId,
      id,
      req.user.userId
    );
  }

  @Post(":id/helpful")
  @ApiOperation({ summary: "Mark article as helpful" })
  @RequirePermissions("knowledge:update")
  @Audited({
    action: "knowledge.mark_helpful",
    resource: "knowledgeArticle",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  markHelpful(@Request() req: any, @Param("id") id: string) {
    return this.knowledgeService.markHelpful(req.user.organizationId, id);
  }

  @Post(":id/not-helpful")
  @ApiOperation({ summary: "Mark article as not helpful" })
  @RequirePermissions("knowledge:update")
  @Audited({
    action: "knowledge.mark_not_helpful",
    resource: "knowledgeArticle",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  markNotHelpful(@Request() req: any, @Param("id") id: string) {
    return this.knowledgeService.markNotHelpful(req.user.organizationId, id);
  }

  @Post(":id/revert")
  @ApiOperation({ summary: "Revert article to a previous version" })
  @RequirePermissions("knowledge:update")
  @Audited({
    action: "knowledge.revert",
    resource: "knowledgeArticle",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  revert(
    @Request() req: any,
    @Param("id") id: string,
    @Body() dto: RevertKnowledgeArticleVersionDto
  ) {
    return this.knowledgeService.revertToVersion(
      req.user.organizationId,
      id,
      req.user.userId,
      dto
    );
  }
}
