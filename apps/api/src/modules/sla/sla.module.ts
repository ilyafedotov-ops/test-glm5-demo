import { Module, Global } from "@nestjs/common";
import { PriorityMatrixService } from "./priority-matrix.service";
import { SLACalculationService } from "./sla-calculation.service";
import { PrismaModule } from "@/prisma/prisma.module";

@Global()
@Module({
  imports: [PrismaModule],
  providers: [PriorityMatrixService, SLACalculationService],
  exports: [PriorityMatrixService, SLACalculationService],
})
export class SLAModule {}
