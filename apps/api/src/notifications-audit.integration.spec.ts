import "reflect-metadata";
import { Test } from "@nestjs/testing";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { INestApplication } from "@nestjs/common";
import { NotificationsController } from "@/modules/notifications/notifications.controller";
import { NotificationsService } from "@/modules/notifications/notifications.service";
import { AuditInterceptor } from "@/modules/audit/interceptors/audit.interceptor";
import { JwtAuthGuard } from "@/modules/auth/jwt-auth.guard";
import { PermissionsGuard } from "@/modules/auth/guards/permissions.guard";
import { PrismaService } from "@/prisma/prisma.service";

describe("Notifications audit integration", () => {
  let app: INestApplication;
  let baseUrl: string;

  const auditLogCreate = jest.fn(async (_args: any) => undefined);
  const notificationFindUnique = jest.fn(async ({ where }: any) => ({
    id: where.id,
    isRead: false,
  }));

  const prismaMock = {
    auditLog: {
      create: auditLogCreate,
    },
    notification: {
      findUnique: notificationFindUnique,
    },
  };

  const notificationsServiceMock = {
    findAll: jest.fn(async () => ({ data: [], unreadCount: 0 })),
    markAsRead: jest.fn(async (id: string) => ({
      id,
      userId: "user-1",
      type: "incident_assigned",
      title: "Assigned",
      message: "Assigned to you",
      isRead: true,
      createdAt: new Date(),
    })),
    markAllAsRead: jest.fn(async () => undefined),
    remove: jest.fn(async () => undefined),
    getPreferences: jest.fn(async () => ({
      emailIncidentAssigned: true,
      emailIncidentResolved: true,
      emailSlaBreached: true,
      emailChangeApproved: true,
      emailDailyDigest: false,
      inAppAll: true,
    })),
    updatePreferences: jest.fn(async (userId: string, dto: Record<string, unknown>) => ({
      emailIncidentAssigned: dto.emailIncidentAssigned ?? true,
      emailIncidentResolved: true,
      emailSlaBreached: true,
      emailChangeApproved: true,
      emailDailyDigest: false,
      inAppAll: true,
    })),
  };

  beforeAll(async () => {
    const moduleBuilder = Test.createTestingModule({
      controllers: [NotificationsController],
      providers: [
        {
          provide: NotificationsService,
          useValue: notificationsServiceMock,
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
            permissions: [
              "notifications:read",
              "notifications:update",
              "notifications:delete",
            ],
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
    notificationFindUnique.mockClear();
  });

  afterAll(async () => {
    await app.close();
  });

  it("writes audit log for audited mutation endpoint", async () => {
    const response = await fetch(`${baseUrl}/notifications/notif-123/read`, {
      method: "PATCH",
    });

    expect(response.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(notificationFindUnique).toHaveBeenCalledWith({
      where: { id: "notif-123" },
    });
    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const payload = auditLogCreate.mock.calls[0]?.[0] as any;
    expect(payload).toBeDefined();
    expect(payload.data.action).toBe("notification.mark_read");
    expect(payload.data.resource).toBe("notification");
    expect(payload.data.resourceId).toBe("notif-123");
    expect(payload.data.organizationId).toBe("org-1");
    expect(payload.data.actorId).toBe("user-1");
  });

  it("does not write audit log for read-only endpoint", async () => {
    const response = await fetch(`${baseUrl}/notifications`);

    expect(response.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(auditLogCreate).not.toHaveBeenCalled();
  });

  it("writes audit log for preferences update endpoint", async () => {
    const response = await fetch(`${baseUrl}/notifications/preferences`, {
      method: "PATCH",
      headers: {
        "content-type": "application/json",
      },
      body: JSON.stringify({ emailIncidentAssigned: false }),
    });

    expect(response.status).toBe(200);

    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    const payload = auditLogCreate.mock.calls[0]?.[0] as any;
    expect(payload).toBeDefined();
    expect(payload.data.action).toBe("notification_preferences.update");
    expect(payload.data.resource).toBe("notificationPreference");
    expect(payload.data.actorId).toBe("user-1");
  });
});
