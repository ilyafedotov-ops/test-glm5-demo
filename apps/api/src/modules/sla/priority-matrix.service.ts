import { Injectable } from "@nestjs/common";

/**
 * ITIL Priority Matrix Service
 * Calculates priority based on Impact x Urgency
 */
@Injectable()
export class PriorityMatrixService {
  private readonly priorityMatrix: Record<string, Record<string, string>> = {
    // Impact levels: critical, high, medium, low
    // Urgency levels: critical, high, medium, low
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

  /**
   * Calculate priority from impact and urgency
   */
  calculatePriority(impact: string, urgency: string): string {
    const normalizedImpact = impact.toLowerCase();
    const normalizedUrgency = urgency.toLowerCase();

    const impactMatrix = this.priorityMatrix[normalizedImpact];
    if (!impactMatrix) {
      return "medium"; // Default fallback
    }

    return impactMatrix[normalizedUrgency] || "medium";
  }

  /**
   * Get priority weight for sorting (higher = more important)
   */
  getPriorityWeight(priority: string): number {
    const weights: Record<string, number> = {
      critical: 4,
      high: 3,
      medium: 2,
      low: 1,
    };
    return weights[priority.toLowerCase()] || 2;
  }

  /**
   * Compare two priorities
   * Returns: positive if a > b, negative if a < b, 0 if equal
   */
  comparePriorities(a: string, b: string): number {
    return this.getPriorityWeight(a) - this.getPriorityWeight(b);
  }

  /**
   * Get recommended SLA policy based on priority
   */
  getRecommendedSLA(priority: string): { responseMins: number; resolutionMins: number } {
    const slaMap: Record<string, { responseMins: number; resolutionMins: number }> = {
      critical: { responseMins: 15, resolutionMins: 240 }, // 15min response, 4hr resolution
      high: { responseMins: 30, resolutionMins: 480 }, // 30min response, 8hr resolution
      medium: { responseMins: 120, resolutionMins: 1440 }, // 2hr response, 24hr resolution
      low: { responseMins: 480, resolutionMins: 10080 }, // 8hr response, 7 day resolution
    };

    return slaMap[priority.toLowerCase()] || slaMap.medium;
  }

  /**
   * Get all valid priority values
   */
  getValidPriorities(): string[] {
    return ["critical", "high", "medium", "low"];
  }

  /**
   * Get all valid impact values
   */
  getValidImpacts(): string[] {
    return ["critical", "high", "medium", "low"];
  }

  /**
   * Get all valid urgency values
   */
  getValidUrgencies(): string[] {
    return ["critical", "high", "medium", "low"];
  }

  /**
   * Get priority matrix as a 2D array (for UI display)
   */
  getMatrixAsArray(): { impact: string; urgency: string; priority: string }[] {
    const result: { impact: string; urgency: string; priority: string }[] = [];
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
}
