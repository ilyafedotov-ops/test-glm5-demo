import { Module } from "@nestjs/common";
import { IncidentsService } from "./incidents.service";
import { IncidentsController } from "./incidents.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { SLAModule } from "../sla/sla.module";
import { ActivitiesModule } from "../activities/activities.module";
import { WorkflowsModule } from "../workflows/workflows.module";
import { ExportModule } from "../export/export.module";
import { ConfigurationItemsModule } from "../configuration-items/configuration-items.module";

@Module({
  imports: [
    PrismaModule,
    SLAModule,
    ActivitiesModule,
    WorkflowsModule,
    ExportModule,
    ConfigurationItemsModule,
  ],
  controllers: [IncidentsController],
  providers: [IncidentsService],
  exports: [IncidentsService],
})
export class IncidentsModule {}
