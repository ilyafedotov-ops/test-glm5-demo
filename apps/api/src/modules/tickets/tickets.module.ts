import { Module, Global } from "@nestjs/common";
import { TicketsService } from "./tickets.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [TicketsService],
  exports: [TicketsService],
})
export class TicketsModule {}
