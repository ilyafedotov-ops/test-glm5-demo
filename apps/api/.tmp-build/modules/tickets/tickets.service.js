"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var TicketsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TicketsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
let TicketsService = TicketsService_1 = class TicketsService {
    prisma;
    logger = new common_1.Logger(TicketsService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async generateTicketNumber(organizationId, type) {
        const prefixMap = {
            incident: "INC",
            problem: "PRB",
            change: "CHG",
            request: "REQ",
        };
        const prefix = prefixMap[type];
        const countField = `${type}Count`;
        const result = await this.prisma.$transaction(async (tx) => {
            let counter = await tx.ticketCounter.findUnique({
                where: { organizationId },
            });
            if (!counter) {
                counter = await tx.ticketCounter.create({
                    data: { organizationId },
                });
            }
            const updateData = {};
            updateData[`${type}Count`] = { increment: 1 };
            const updated = await tx.ticketCounter.update({
                where: { organizationId },
                data: updateData,
            });
            const count = updated[`${type}Count`];
            const ticketNumber = `${prefix}-${count.toString().padStart(6, "0")}`;
            return ticketNumber;
        });
        this.logger.log(`Generated ticket number: ${result} for org ${organizationId}`);
        return result;
    }
    parseTicketNumber(ticketNumber) {
        const match = ticketNumber.match(/^(INC|PRB|CHG|REQ)-(\d+)$/);
        if (!match)
            return null;
        const typeMap = {
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
    async findByTicketNumber(organizationId, ticketNumber) {
        const parsed = this.parseTicketNumber(ticketNumber);
        if (!parsed)
            return null;
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
};
exports.TicketsService = TicketsService;
exports.TicketsService = TicketsService = TicketsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], TicketsService);
//# sourceMappingURL=tickets.service.js.map