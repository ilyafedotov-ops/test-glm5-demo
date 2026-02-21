import { Module, MiddlewareConsumer, NestModule } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./modules/auth/auth.module";
import { UsersModule } from "./modules/users/users.module";
import { IncidentsModule } from "./modules/incidents/incidents.module";
import { WorkflowsModule } from "./modules/workflows/workflows.module";
import { PoliciesModule } from "./modules/policies/policies.module";
import { ViolationsModule } from "./modules/violations/violations.module";
import { TasksModule } from "./modules/tasks/tasks.module";
import { AuditModule } from "./modules/audit/audit.module";
import { ReportsModule } from "./modules/reports/reports.module";
import { NotificationsModule } from "./modules/notifications/notifications.module";
import { DashboardModule } from "./modules/dashboard/dashboard.module";
import { RolesModule } from "./modules/roles/roles.module";
import { TeamsModule } from "./modules/teams/teams.module";
import { OrganizationsModule } from "./modules/organizations/organizations.module";
import { ActivitiesModule } from "./modules/activities/activities.module";
import { ProblemsModule } from "./modules/problems/problems.module";
import { ChangesModule } from "./modules/changes/changes.module";
import { SLADashboardModule } from "./modules/sla-dashboard/sla-dashboard.module";
import { ServiceCatalogModule } from "./modules/service-catalog/service-catalog.module";
import { KnowledgeModule } from "./modules/knowledge/knowledge.module";
import { SettingsModule } from "./modules/settings/settings.module";
import { ExportModule } from "./modules/export/export.module";
import { QueueModule } from "./queue/queue.module";
import { CacheModule } from "./cache/cache.module";
import { LoggingModule } from "./common/logging";
import { CorrelationMiddleware } from "./common/middleware/correlation.middleware";
import { MonitoringModule } from "./modules/monitoring/monitoring.module";
import { ConfigurationItemsModule } from "./modules/configuration-items/configuration-items.module";
import { AdminGovernanceModule } from "./modules/admin-governance/admin-governance.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env", ".env.local"],
    }),
    LoggingModule.register({
      enableHttpLogging: true,
      enableExceptionLogging: true,
      interceptorOptions: {
        logBody: false,
        logHeaders: false,
        logResponseBody: false,
        excludePaths: [],
        healthCheckPaths: ['/health', '/api/health', '/metrics'],
      },
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    IncidentsModule,
    WorkflowsModule,
    PoliciesModule,
    ViolationsModule,
    TasksModule,
    AuditModule,
    ReportsModule,
    NotificationsModule,
    DashboardModule,
    RolesModule,
    TeamsModule,
    OrganizationsModule,
    ActivitiesModule,
    ProblemsModule,
    ChangesModule,
    SLADashboardModule,
    ServiceCatalogModule,
    KnowledgeModule,
    SettingsModule,
    ExportModule,
    QueueModule,
    CacheModule,
    MonitoringModule,
    ConfigurationItemsModule,
    AdminGovernanceModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CorrelationMiddleware)
      .forRoutes('*');
  }
}
