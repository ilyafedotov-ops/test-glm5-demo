import { Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "@/prisma/prisma.service";

@Injectable()
export class SLACalculationService {
  private readonly logger = new Logger(SLACalculationService.name);

  // Default business hours (can be overridden by organization settings)
  private readonly defaultBusinessHours = {
    startHour: 9, // 9 AM
    endHour: 17, // 5 PM
    workDays: [1, 2, 3, 4, 5], // Monday to Friday (0 = Sunday, 6 = Saturday)
    timezone: "UTC",
  };

  constructor(private prisma: PrismaService) {}

  /**
   * Calculate SLA deadline
   */
  calculateSLADeadline(
    startTime: Date,
    durationMinutes: number,
    businessHoursOnly: boolean = true,
    orgSettings?: any
  ): Date {
    if (!businessHoursOnly) {
      // Simple calculation: just add minutes
      return new Date(startTime.getTime() + durationMinutes * 60 * 1000);
    }

    // Business hours calculation
    const config = {
      ...this.defaultBusinessHours,
      ...(orgSettings?.businessHours || {}),
    };

    let remainingMinutes = durationMinutes;
    let currentTime = new Date(startTime);

    while (remainingMinutes > 0) {
      // Move to next business day if needed
      currentTime = this.getNextBusinessMoment(currentTime, config);

      // Calculate available minutes in current business day
      const endOfBusinessDay = this.getEndOfBusinessDay(currentTime, config);
      const availableMinutes = Math.floor(
        (endOfBusinessDay.getTime() - currentTime.getTime()) / (60 * 1000)
      );

      if (remainingMinutes <= availableMinutes) {
        // SLA ends within current business day
        return new Date(currentTime.getTime() + remainingMinutes * 60 * 1000);
      }

      // Use up remaining minutes in current day and move to next
      remainingMinutes -= availableMinutes;
      currentTime = this.getStartOfNextBusinessDay(currentTime, config);
    }

    return currentTime;
  }

  /**
   * Check if a time is within business hours
   */
  isWithinBusinessHours(time: Date, config?: any): boolean {
    const cfg = { ...this.defaultBusinessHours, ...(config || {}) };
    const day = time.getDay();

    if (!cfg.workDays.includes(day)) {
      return false;
    }

    const hour = time.getHours();
    return hour >= cfg.startHour && hour < cfg.endHour;
  }

  /**
   * Get next business moment (if currently outside business hours)
   */
  private getNextBusinessMoment(time: Date, config: any): Date {
    const result = new Date(time);

    // If before business hours today, move to start of business hours
    if (result.getHours() < config.startHour) {
      result.setHours(config.startHour, 0, 0, 0);
    }
    // If after business hours today, move to start of next business day
    else if (result.getHours() >= config.endHour) {
      result.setDate(result.getDate() + 1);
      result.setHours(config.startHour, 0, 0, 0);
    }

    // If not a work day, move to next work day
    while (!config.workDays.includes(result.getDay())) {
      result.setDate(result.getDate() + 1);
    }

    return result;
  }

  /**
   * Get end of business day for a given date
   */
  private getEndOfBusinessDay(date: Date, config: any): Date {
    const result = new Date(date);
    result.setHours(config.endHour, 0, 0, 0);
    return result;
  }

  /**
   * Get start of next business day
   */
  private getStartOfNextBusinessDay(date: Date, config: any): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + 1);
    result.setHours(config.startHour, 0, 0, 0);

    while (!config.workDays.includes(result.getDay())) {
      result.setDate(result.getDate() + 1);
    }

    return result;
  }

  /**
   * Calculate elapsed business minutes between two dates
   */
  calculateElapsedBusinessMinutes(start: Date, end: Date, config?: any): number {
    const cfg = { ...this.defaultBusinessHours, ...(config || {}) };
    let elapsed = 0;
    let current = new Date(start);

    while (current < end) {
      if (this.isWithinBusinessHours(current, cfg)) {
        elapsed++;
      }
      current = new Date(current.getTime() + 60 * 1000); // Add 1 minute
    }

    return elapsed;
  }

  /**
   * Check if SLA is breached
   */
  isSLABreached(deadline: Date, currentTime: Date = new Date()): boolean {
    return currentTime > deadline;
  }

  /**
   * Get SLA status (on_track, at_risk, breached)
   */
  getSLAStatus(
    deadline: Date,
    currentTime: Date = new Date()
  ): "on_track" | "at_risk" | "breached" {
    if (currentTime > deadline) {
      return "breached";
    }

    const remainingMs = deadline.getTime() - currentTime.getTime();
    const remainingMinutes = remainingMs / (60 * 1000);

    // At risk if less than 30 minutes remaining
    if (remainingMinutes < 30) {
      return "at_risk";
    }

    // At risk if less than 20% of time remaining
    // This would need the original duration to calculate properly
    // For now, using simple threshold
    return "on_track";
  }

  /**
   * Calculate SLA deadlines for an incident
   */
  async calculateIncidentSLA(
    organizationId: string,
    priority: string,
    createdAt: Date = new Date()
  ): Promise<{ responseDue: Date; resolutionDue: Date }> {
    // Find matching SLA policy
    const slaPolicy = await this.prisma.sLAPolicy.findFirst({
      where: {
        organizationId,
        priority: priority.toLowerCase(),
        isActive: true,
      },
    });

    if (slaPolicy) {
      return {
        responseDue: this.calculateSLADeadline(
          createdAt,
          slaPolicy.responseTimeMins,
          slaPolicy.businessHoursOnly
        ),
        resolutionDue: this.calculateSLADeadline(
          createdAt,
          slaPolicy.resolutionTimeMins,
          slaPolicy.businessHoursOnly
        ),
      };
    }

    // Default SLA if no policy found
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
}
