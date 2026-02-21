import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { INestApplication } from "@nestjs/common";
import { TasksController } from "@/modules/tasks/tasks.controller";
import { TasksService } from "@/modules/tasks/tasks.service";
import { AuditInterceptor } from "@/modules/audit/interceptors/audit.interceptor";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { PrismaService } from "@/prisma/prisma.service";

describe("Tasks audit integration", () => {
  let app: INestApplication;
  let baseUrl: string;

  const auditLogCreate = jest.fn(async (_args: any) => undefined);
  const taskFindUnique = jest.fn(async ({ where }: any) => ({
    id: where.id,
    status: "open",
  }));

  const prismaMock = {
    auditLog: {
      create: auditLogCreate,
    },
    task: {
      findUnique: taskFindUnique,
    },
  };

  const tasksServiceMock = {
    findAll: jest.fn(async () => []),
    update: jest.fn(async (id: string, organizationId: string, userId: string, dto: Record<string, unknown>) => ({
      id,
      organizationId,
      updatedById: userId,
      ...dto,
    })),
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [TasksController],
      providers: [
        {
          provide: TasksService,
          useValue: tasksServiceMock,
        },
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: AuditInterceptor,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context: any) => {
          const request = context.switchToHttp().getRequest();
          request.user = {
            userId: "user-1",
            organizationId: "org-1",
            roles: [],
            permissions: ["tasks:read", "tasks:update"],
          };
          return true;
        },
      })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true });

    const moduleRef = await moduleBuilder.compile();

    app = moduleRef.createNestApplication();
    await app.init();
    await app.listen(0);
    baseUrl = await app.getUrl();
  });

  afterEach(() => {
    auditLogCreate.mockClear();
    taskFindUnique.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it("writes audit log for audited task mutation endpoint", async () => {
    const response = await fetch(`${baseUrl}/tasks/task-1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Task updated" }),
    });

    expect(response.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(taskFindUnique).toHaveBeenCalledWith({
      where: { id: "task-1" },
    });
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const payload = auditLogCreate.mock.calls[0]?.[0] as any;
    expect(payload).toBeDefined();
    expect(payload.data.action).toBe("task.update");
    expect(payload.data.resource).toBe("task");
    expect(payload.data.resourceId).toBe("task-1");
    expect(payload.data.organizationId).toBe("org-1");
    expect(payload.data.actorId).toBe("user-1");
  });

  it("does not write audit log for task read endpoint", async () => {
    const response = await fetch(`${baseUrl}/tasks`);
    expect(response.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(auditLogCreate).not.toHaveBeenCalled();
  });
});
