"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IncidentsModule = void 0;
const common_1 = require("@nestjs/common");
const incidents_service_1 = require("./incidents.service");
const incidents_controller_1 = require("./incidents.controller");
const prisma_module_1 = require("@/prisma/prisma.module");
const sla_module_1 = require("../sla/sla.module");
const activities_module_1 = require("../activities/activities.module");
const workflows_module_1 = require("../workflows/workflows.module");
const export_module_1 = require("../export/export.module");
const configuration_items_module_1 = require("../configuration-items/configuration-items.module");
let IncidentsModule = class IncidentsModule {
};
exports.IncidentsModule = IncidentsModule;
exports.IncidentsModule = IncidentsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            prisma_module_1.PrismaModule,
            sla_module_1.SLAModule,
            activities_module_1.ActivitiesModule,
            workflows_module_1.WorkflowsModule,
            export_module_1.ExportModule,
            configuration_items_module_1.ConfigurationItemsModule,
        ],
        controllers: [incidents_controller_1.IncidentsController],
        providers: [incidents_service_1.IncidentsService],
        exports: [incidents_service_1.IncidentsService],
    })
], IncidentsModule);
//# sourceMappingURL=incidents.module.js.map