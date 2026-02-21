import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { INestApplication } from "@nestjs/common";
import { ChangesController } from "@/modules/changes/changes.controller";
import { ChangesService } from "@/modules/changes/changes.service";
import { AuditInterceptor } from "@/modules/audit/interceptors/audit.interceptor";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { PrismaService } from "@/prisma/prisma.service";

describe("Changes audit integration", () => {
  let app: INestApplication;
  let baseUrl: string;

  const auditLogCreate = jest.fn(async (_args: any) => undefined);
  const changeRequestFindUnique = jest.fn(async ({ where }: any) => ({
    id: where.id,
    status: "pending",
  }));

  const prismaMock = {
    auditLog: {
      create: auditLogCreate,
    },
    changeRequest: {
      findUnique: changeRequestFindUnique,
    },
  };

  const changesServiceMock = {
    create: jest.fn(async (organizationId: string, userId: string, dto: Record<string, unknown>) => ({
      id: "change-1",
      organizationId,
      createdById: userId,
      ...dto,
    })),
    findAll: jest.fn(async () => []),
    update: jest.fn(async (organizationId: string, id: string, userId: string, dto: Record<string, unknown>) => ({
      id,
      organizationId,
      updatedById: userId,
      ...dto,
    })),
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [ChangesController],
      providers: [
        {
          provide: ChangesService,
          useValue: changesServiceMock,
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
            permissions: ["changes:read", "changes:write", "changes:update"],
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
    changeRequestFindUnique.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it("writes audit log for audited change mutation endpoint", async () => {
    const response = await fetch(`${baseUrl}/changes/change-1`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ title: "Updated title" }),
    });

    expect(response.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(changeRequestFindUnique).toHaveBeenCalledWith({
      where: { id: "change-1" },
    });
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const payload = auditLogCreate.mock.calls[0]?.[0] as any;
    expect(payload).toBeDefined();
    expect(payload.data.action).toBe("change.update");
    expect(payload.data.resource).toBe("changeRequest");
    expect(payload.data.resourceId).toBe("change-1");
    expect(payload.data.organizationId).toBe("org-1");
    expect(payload.data.actorId).toBe("user-1");
  });

  it("does not write audit log for change read endpoint", async () => {
    const response = await fetch(`${baseUrl}/changes`);
    expect(response.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(auditLogCreate).not.toHaveBeenCalled();
  });
});
