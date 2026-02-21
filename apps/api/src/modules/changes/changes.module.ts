import { Module } from "@nestjs/common";
import { ChangesService } from "./changes.service";
import { ChangesController } from "./changes.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { SLAModule } from "../sla/sla.module";
import { ActivitiesModule } from "../activities/activities.module";

@Module({
  imports: [PrismaModule, SLAModule, ActivitiesModule],
  controllers: [ChangesController],
  providers: [ChangesService],
  exports: [ChangesService],
})
export class ChangesModule {}
