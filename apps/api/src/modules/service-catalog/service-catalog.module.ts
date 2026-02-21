import { Module } from "@nestjs/common";
import { ServiceCatalogService } from "./service-catalog.service";
import { ServiceCatalogController } from "./service-catalog.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { TicketsModule } from "../tickets/tickets.module";
import { ActivitiesModule } from "../activities/activities.module";

@Module({
  imports: [PrismaModule, TicketsModule, ActivitiesModule],
  controllers: [ServiceCatalogController],
  providers: [ServiceCatalogService],
  exports: [ServiceCatalogService],
})
export class ServiceCatalogModule {}
