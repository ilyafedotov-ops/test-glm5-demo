import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";
import { Prisma } from "@prisma/client";

@Injectable()
export class TicketsService {
  private readonly logger = new Logger(TicketsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Generate a unique ticket number for an entity type
   */
  async generateTicketNumber(
    organizationId: string,
    type: "incident" | "problem" | "change" | "request"
  ): Promise<string> {
    const prefixMap = {
      incident: "INC",
      problem: "PRB",
      change: "CHG",
      request: "REQ",
    };

    const prefix = prefixMap[type];
    const countField = `${type}Count` as keyof Prisma.TicketCounterWhereInput;

    // Use transaction to ensure atomicity
    const result = await this.prisma.$transaction(async (tx) => {
      // Get or create counter
      let counter = await tx.ticketCounter.findUnique({
        where: { organizationId },
      });

      if (!counter) {
        counter = await tx.ticketCounter.create({
          data: { organizationId },
        });
      }

      // Increment the appropriate counter
      const updateData: any = {};
      updateData[`${type}Count`] = { increment: 1 };

      const updated = await tx.ticketCounter.update({
        where: { organizationId },
        data: updateData,
      });

      const count = updated[`${type}Count` as keyof typeof updated] as number;
      const ticketNumber = `${prefix}-${count.toString().padStart(6, "0")}`;

      return ticketNumber;
    });

    this.logger.log(`Generated ticket number: ${result} for org ${organizationId}`);
    return result;
  }

  /**
   * Parse a ticket number to extract type and number
   */
  parseTicketNumber(ticketNumber: string): { type: string; number: number } | null {
    const match = ticketNumber.match(/^(INC|PRB|CHG|REQ)-(\d+)$/);
    if (!match) return null;

    const typeMap: Record<string, string> = {
      INC: "incident",
      PRB: "problem",
      CHG: "change",
      REQ: "request",
    };

    return {
      type: typeMap[match[1]],
      number: parseInt(match[2], 10),
    };
  }

  /**
   * Find entity by ticket number
   */
  async findByTicketNumber(
    organizationId: string,
    ticketNumber: string
  ): Promise<any | null> {
    const parsed = this.parseTicketNumber(ticketNumber);
    if (!parsed) return null;

    switch (parsed.type) {
      case "incident":
        return this.prisma.incident.findFirst({
          where: { organizationId, ticketNumber },
        });
      case "problem":
        return this.prisma.problem.findFirst({
          where: { organizationId, ticketNumber },
        });
      case "change":
        return this.prisma.changeRequest.findFirst({
          where: { organizationId, ticketNumber },
        });
      default:
        return null;
    }
  }
}
