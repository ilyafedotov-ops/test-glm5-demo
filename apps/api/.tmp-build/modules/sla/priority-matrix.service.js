"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PriorityMatrixService = void 0;
const common_1 = require("@nestjs/common");
let PriorityMatrixService = class PriorityMatrixService {
    priorityMatrix = {
        critical: {
            critical: "critical",
            high: "critical",
            medium: "high",
            low: "medium",
        },
        high: {
            critical: "critical",
            high: "high",
            medium: "high",
            low: "medium",
        },
        medium: {
            critical: "high",
            high: "high",
            medium: "medium",
            low: "low",
        },
        low: {
            critical: "medium",
            high: "medium",
            medium: "low",
            low: "low",
        },
    };
    calculatePriority(impact, urgency) {
        const normalizedImpact = impact.toLowerCase();
        const normalizedUrgency = urgency.toLowerCase();
        const impactMatrix = this.priorityMatrix[normalizedImpact];
        if (!impactMatrix) {
            return "medium";
        }
        return impactMatrix[normalizedUrgency] || "medium";
    }
    getPriorityWeight(priority) {
        const weights = {
            critical: 4,
            high: 3,
            medium: 2,
            low: 1,
        };
        return weights[priority.toLowerCase()] || 2;
    }
    comparePriorities(a, b) {
        return this.getPriorityWeight(a) - this.getPriorityWeight(b);
    }
    getRecommendedSLA(priority) {
        const slaMap = {
            critical: { responseMins: 15, resolutionMins: 240 },
            high: { responseMins: 30, resolutionMins: 480 },
            medium: { responseMins: 120, resolutionMins: 1440 },
            low: { responseMins: 480, resolutionMins: 10080 },
        };
        return slaMap[priority.toLowerCase()] || slaMap.medium;
    }
    getValidPriorities() {
        return ["critical", "high", "medium", "low"];
    }
    getValidImpacts() {
        return ["critical", "high", "medium", "low"];
    }
    getValidUrgencies() {
        return ["critical", "high", "medium", "low"];
    }
    getMatrixAsArray() {
        const result = [];
        const impacts = ["critical", "high", "medium", "low"];
        const urgencies = ["critical", "high", "medium", "low"];
        for (const impact of impacts) {
            for (const urgency of urgencies) {
                result.push({
                    impact,
                    urgency,
                    priority: this.calculatePriority(impact, urgency),
                });
            }
        }
        return result;
    }
};
exports.PriorityMatrixService = PriorityMatrixService;
exports.PriorityMatrixService = PriorityMatrixService = __decorate([
    (0, common_1.Injectable)()
], PriorityMatrixService);
//# sourceMappingURL=priority-matrix.service.js.map