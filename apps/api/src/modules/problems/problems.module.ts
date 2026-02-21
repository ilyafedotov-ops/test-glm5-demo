import { Module } from "@nestjs/common";
import { ProblemsService } from "./problems.service";
import { ProblemsController } from "./problems.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { SLAModule } from "../sla/sla.module";
import { ActivitiesModule } from "../activities/activities.module";

@Module({
  imports: [PrismaModule, SLAModule, ActivitiesModule],
  controllers: [ProblemsController],
  providers: [ProblemsService],
  exports: [ProblemsService],
})
export class ProblemsModule {}
