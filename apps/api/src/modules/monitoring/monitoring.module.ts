import { Module, Global } from "@nestjs/common";
import { MonitoringService } from "./monitoring.service";
import { HealthController } from "./health.controller";
import { MetricsController } from "./metrics.controller";
import { MetricsService } from "./metrics.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [HealthController, MetricsController],
  providers: [MonitoringService, MetricsService],
  exports: [MonitoringService, MetricsService],
})
export class MonitoringModule {}
