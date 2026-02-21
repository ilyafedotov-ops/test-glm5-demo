import { Module } from "@nestjs/common";
import { KnowledgeService } from "./knowledge.service";
import { KnowledgeController } from "./knowledge.controller";
import { PrismaModule } from "@/prisma/prisma.module";
import { ActivitiesModule } from "../activities/activities.module";

@Module({
  imports: [PrismaModule, ActivitiesModule],
  controllers: [KnowledgeController],
  providers: [KnowledgeService],
  exports: [KnowledgeService],
})
export class KnowledgeModule {}
