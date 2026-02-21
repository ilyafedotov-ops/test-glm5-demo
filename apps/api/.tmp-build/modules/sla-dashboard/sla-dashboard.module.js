"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLADashboardModule = void 0;
const common_1 = require("@nestjs/common");
const sla_dashboard_service_1 = require("./sla-dashboard.service");
const sla_dashboard_controller_1 = require("./sla-dashboard.controller");
const prisma_module_1 = require("@/prisma/prisma.module");
const sla_module_1 = require("../sla/sla.module");
let SLADashboardModule = class SLADashboardModule {
};
exports.SLADashboardModule = SLADashboardModule;
exports.SLADashboardModule = SLADashboardModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, sla_module_1.SLAModule],
        controllers: [sla_dashboard_controller_1.SLADashboardController],
        providers: [sla_dashboard_service_1.SLADashboardService],
        exports: [sla_dashboard_service_1.SLADashboardService],
    })
], SLADashboardModule);
//# sourceMappingURL=sla-dashboard.module.js.map