"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const incidents_module_1 = require("./modules/incidents/incidents.module");
const workflows_module_1 = require("./modules/workflows/workflows.module");
const policies_module_1 = require("./modules/policies/policies.module");
const violations_module_1 = require("./modules/violations/violations.module");
const tasks_module_1 = require("./modules/tasks/tasks.module");
const audit_module_1 = require("./modules/audit/audit.module");
const reports_module_1 = require("./modules/reports/reports.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
const dashboard_module_1 = require("./modules/dashboard/dashboard.module");
const roles_module_1 = require("./modules/roles/roles.module");
const teams_module_1 = require("./modules/teams/teams.module");
const organizations_module_1 = require("./modules/organizations/organizations.module");
const activities_module_1 = require("./modules/activities/activities.module");
const problems_module_1 = require("./modules/problems/problems.module");
const changes_module_1 = require("./modules/changes/changes.module");
const sla_dashboard_module_1 = require("./modules/sla-dashboard/sla-dashboard.module");
const service_catalog_module_1 = require("./modules/service-catalog/service-catalog.module");
const knowledge_module_1 = require("./modules/knowledge/knowledge.module");
const settings_module_1 = require("./modules/settings/settings.module");
const export_module_1 = require("./modules/export/export.module");
const queue_module_1 = require("./queue/queue.module");
const cache_module_1 = require("./cache/cache.module");
const logging_1 = require("./common/logging");
const correlation_middleware_1 = require("./common/middleware/correlation.middleware");
const monitoring_module_1 = require("./modules/monitoring/monitoring.module");
const configuration_items_module_1 = require("./modules/configuration-items/configuration-items.module");
const admin_governance_module_1 = require("./modules/admin-governance/admin-governance.module");
let AppModule = class AppModule {
    configure(consumer) {
        consumer
            .apply(correlation_middleware_1.CorrelationMiddleware)
            .forRoutes('*');
    }
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: [".env", ".env.local"],
            }),
            logging_1.LoggingModule.register({
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
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            incidents_module_1.IncidentsModule,
            workflows_module_1.WorkflowsModule,
            policies_module_1.PoliciesModule,
            violations_module_1.ViolationsModule,
            tasks_module_1.TasksModule,
            audit_module_1.AuditModule,
            reports_module_1.ReportsModule,
            notifications_module_1.NotificationsModule,
            dashboard_module_1.DashboardModule,
            roles_module_1.RolesModule,
            teams_module_1.TeamsModule,
            organizations_module_1.OrganizationsModule,
            activities_module_1.ActivitiesModule,
            problems_module_1.ProblemsModule,
            changes_module_1.ChangesModule,
            sla_dashboard_module_1.SLADashboardModule,
            service_catalog_module_1.ServiceCatalogModule,
            knowledge_module_1.KnowledgeModule,
            settings_module_1.SettingsModule,
            export_module_1.ExportModule,
            queue_module_1.QueueModule,
            cache_module_1.CacheModule,
            monitoring_module_1.MonitoringModule,
            configuration_items_module_1.ConfigurationItemsModule,
            admin_governance_module_1.AdminGovernanceModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map