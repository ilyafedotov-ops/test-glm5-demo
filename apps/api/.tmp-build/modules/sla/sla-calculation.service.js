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
var SLACalculationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLACalculationService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("@/prisma/prisma.service");
let SLACalculationService = SLACalculationService_1 = class SLACalculationService {
    prisma;
    logger = new common_1.Logger(SLACalculationService_1.name);
    defaultBusinessHours = {
        startHour: 9,
        endHour: 17,
        workDays: [1, 2, 3, 4, 5],
        timezone: "UTC",
    };
    constructor(prisma) {
        this.prisma = prisma;
    }
    calculateSLADeadline(startTime, durationMinutes, businessHoursOnly = true, orgSettings) {
        if (!businessHoursOnly) {
            return new Date(startTime.getTime() + durationMinutes * 60 * 1000);
        }
        const config = {
            ...this.defaultBusinessHours,
            ...(orgSettings?.businessHours || {}),
        };
        let remainingMinutes = durationMinutes;
        let currentTime = new Date(startTime);
        while (remainingMinutes > 0) {
            currentTime = this.getNextBusinessMoment(currentTime, config);
            const endOfBusinessDay = this.getEndOfBusinessDay(currentTime, config);
            const availableMinutes = Math.floor((endOfBusinessDay.getTime() - currentTime.getTime()) / (60 * 1000));
            if (remainingMinutes <= availableMinutes) {
                return new Date(currentTime.getTime() + remainingMinutes * 60 * 1000);
            }
            remainingMinutes -= availableMinutes;
            currentTime = this.getStartOfNextBusinessDay(currentTime, config);
        }
        return currentTime;
    }
    isWithinBusinessHours(time, config) {
        const cfg = { ...this.defaultBusinessHours, ...(config || {}) };
        const day = time.getDay();
        if (!cfg.workDays.includes(day)) {
            return false;
        }
        const hour = time.getHours();
        return hour >= cfg.startHour && hour < cfg.endHour;
    }
    getNextBusinessMoment(time, config) {
        const result = new Date(time);
        if (result.getHours() < config.startHour) {
            result.setHours(config.startHour, 0, 0, 0);
        }
        else if (result.getHours() >= config.endHour) {
            result.setDate(result.getDate() + 1);
            result.setHours(config.startHour, 0, 0, 0);
        }
        while (!config.workDays.includes(result.getDay())) {
            result.setDate(result.getDate() + 1);
        }
        return result;
    }
    getEndOfBusinessDay(date, config) {
        const result = new Date(date);
        result.setHours(config.endHour, 0, 0, 0);
        return result;
    }
    getStartOfNextBusinessDay(date, config) {
        const result = new Date(date);
        result.setDate(result.getDate() + 1);
        result.setHours(config.startHour, 0, 0, 0);
        while (!config.workDays.includes(result.getDay())) {
            result.setDate(result.getDate() + 1);
        }
        return result;
    }
    calculateElapsedBusinessMinutes(start, end, config) {
        const cfg = { ...this.defaultBusinessHours, ...(config || {}) };
        let elapsed = 0;
        let current = new Date(start);
        while (current < end) {
            if (this.isWithinBusinessHours(current, cfg)) {
                elapsed++;
            }
            current = new Date(current.getTime() + 60 * 1000);
        }
        return elapsed;
    }
    isSLABreached(deadline, currentTime = new Date()) {
        return currentTime > deadline;
    }
    getSLAStatus(deadline, currentTime = new Date()) {
        if (currentTime > deadline) {
            return "breached";
        }
        const remainingMs = deadline.getTime() - currentTime.getTime();
        const remainingMinutes = remainingMs / (60 * 1000);
        if (remainingMinutes < 30) {
            return "at_risk";
        }
        return "on_track";
    }
    async calculateIncidentSLA(organizationId, priority, createdAt = new Date()) {
        const slaPolicy = await this.prisma.sLAPolicy.findFirst({
            where: {
                organizationId,
                priority: priority.toLowerCase(),
                isActive: true,
            },
        });
        if (slaPolicy) {
            return {
                responseDue: this.calculateSLADeadline(createdAt, slaPolicy.responseTimeMins, slaPolicy.businessHoursOnly),
                resolutionDue: this.calculateSLADeadline(createdAt, slaPolicy.resolutionTimeMins, slaPolicy.businessHoursOnly),
            };
        }
        const defaultSLA = {
            critical: { response: 15, resolution: 240 },
            high: { response: 30, resolution: 480 },
            medium: { response: 120, resolution: 1440 },
            low: { response: 480, resolution: 10080 },
        };
        const sla = defaultSLA[priority.toLowerCase()] || defaultSLA.medium;
        return {
            responseDue: this.calculateSLADeadline(createdAt, sla.response, true),
            resolutionDue: this.calculateSLADeadline(createdAt, sla.resolution, true),
        };
    }
};
exports.SLACalculationService = SLACalculationService;
exports.SLACalculationService = SLACalculationService = SLACalculationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], SLACalculationService);
//# sourceMappingURL=sla-calculation.service.js.map