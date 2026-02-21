import { Module } from "@nestjs/common";
import { SLADashboardService } from "./sla-dashboard.service";
import { SLADashboardController } from "./sla-dashboard.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { SLAModule } from "../sla/sla.module";

@Module({
  imports: [PrismaModule, SLAModule],
  controllers: [SLADashboardController],
  providers: [SLADashboardService],
  exports: [SLADashboardService],
})
export class SLADashboardModule {}
