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
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from "@nestjs/swagger";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { RequirePermissions } from "@/modules/auth/decorators/permissions.decorator";
import { Audited } from "@/modules/audit/decorators/audited.decorator";
import { ProblemsService } from "./problems.service";
import { CreateProblemDto, UpdateProblemDto } from "./dto/create-problem.dto";

@ApiTags("problems")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions("problems:read")
@Controller("problems")
export class ProblemsController {
  constructor(private readonly problemsService: ProblemsService) {}

  @Post()
  @ApiOperation({ summary: "Create a new problem" })
  @RequirePermissions("problems:write")
  @Audited({ action: "problem.create", resource: "problem", captureNewValue: true })
  create(@Request() req: any, @Body() dto: CreateProblemDto) {
    return this.problemsService.create(req.user.organizationId, req.user.userId, dto);
  }

  @Get("options")
  @ApiOperation({ summary: "Get problem form options (incidents, users, teams)" })
  getOptions(@Request() req: { user: { organizationId: string } }) {
    return this.problemsService.getOptions(req.user.organizationId);
  }

  @Get("options/incidents")
  @ApiOperation({ summary: "Search incidents for problem linking selectors" })
  @ApiQuery({ name: "q", required: false, description: "Search query" })
  @ApiQuery({ name: "limit", required: false, description: "Max results (1-50)" })
  getIncidentOptions(
    @Request() req: { user: { organizationId: string } },
    @Query("q") q?: string,
    @Query("limit") limit?: string
  ) {
    const parsedLimit = limit ? Number.parseInt(limit, 10) : undefined;
    return this.problemsService.searchIncidentOptions(
      req.user.organizationId,
      q,
      Number.isFinite(parsedLimit) ? parsedLimit : undefined
    );
  }

  @Get()
  @ApiOperation({ summary: "List all problems" })
  findAll(@Request() req: any, @Query() query: any) {
    return this.problemsService.findAll(req.user.organizationId, query);
  }

  @Get(":id")
  @ApiOperation({ summary: "Get problem details" })
  findOne(@Request() req: any, @Param("id") id: string) {
    return this.problemsService.findOne(req.user.organizationId, id);
  }

  @Patch(":id")
  @ApiOperation({ summary: "Update problem" })
  @RequirePermissions("problems:update")
  @Audited({
    action: "problem.update",
    resource: "problem",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  update(@Request() req: any, @Param("id") id: string, @Body() dto: UpdateProblemDto) {
    return this.problemsService.update(req.user.organizationId, id, req.user.userId, dto);
  }

  @Post(":id/tasks")
  @ApiOperation({ summary: "Add task to problem" })
  @RequirePermissions("problems:update")
  @Audited({ action: "problem.add_task", resource: "problem", captureNewValue: true })
  addTask(
    @Request() req: any,
    @Param("id") id: string,
    @Body() data: { title: string; description?: string; assigneeId?: string }
  ) {
    return this.problemsService.addTask(req.user.organizationId, id, req.user.userId, data);
  }

  @Post(":id/convert-to-known-error")
  @ApiOperation({ summary: "Convert problem to known error" })
  @RequirePermissions("problems:update")
  @Audited({
    action: "problem.convert_to_known_error",
    resource: "problem",
    capturePreviousValue: true,
    captureNewValue: true,
  })
  convertToKnownError(
    @Request() req: any,
    @Param("id") id: string,
    @Body() data: { workaround: string }
  ) {
    return this.problemsService.convertToKnownError(
      req.user.organizationId,
      id,
      req.user.userId,
      data
    );
  }
}
