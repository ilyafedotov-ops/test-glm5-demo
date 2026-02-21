import { Module } from "@nestjs/common";
import { PrismaModule } from "@/prisma/prisma.module";
import { ConfigurationItemsController } from "./configuration-items.controller";
import { ConfigurationItemsService } from "./configuration-items.service";

@Module({
  imports: [PrismaModule],
  controllers: [ConfigurationItemsController],
  providers: [ConfigurationItemsService],
  exports: [ConfigurationItemsService],
})
export class ConfigurationItemsModule {}
