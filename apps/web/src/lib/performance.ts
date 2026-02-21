/**
 * Performance Logging Utilities
 * 
 * Tracks and logs performance metrics for the frontend application
 */

import { logger } from './logger';

// ============================================
// Types
// ============================================

interface PerformanceMetric {
  name: string;
  value: number;
  unit: 'ms' | 's' | 'bytes' | 'count';
  timestamp: number;
  tags?: Record<string, string>;
}

interface TimingEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
}

// ============================================
// Performance Tracker
// ============================================

class PerformanceTracker {
  private timings: Map<string, TimingEntry> = new Map();
  private metrics: PerformanceMetric[] = [];

  /**
   * Start timing an operation
   */
  startTiming(name: string): void {
    this.timings.set(name, {
      name,
      startTime: performance.now(),
    });
  }

  /**
   * End timing an operation and log it
   */
  endTiming(name: string, tags?: Record<string, string>): number | undefined {
    const entry = this.timings.get(name);
    if (!entry) {
      logger.warn(`No timing entry found for: ${name}`);
      return undefined;
    }

    const endTime = performance.now();
    const duration = endTime - entry.startTime;

    entry.endTime = endTime;
    entry.duration = duration;

    // Log the timing
    logger.logPerformance(name, duration, 'ms');

    // Store as metric
    this.metrics.push({
      name,
      value: duration,
      unit: 'ms',
      timestamp: Date.now(),
      tags,
    });

    // Clean up
    this.timings.delete(name);

    return duration;
  }

  /**
   * Measure a function execution time
   */
  async measureAsync<T>(
    name: string,
    fn: () => Promise<T>,
    tags?: Record<string, string>
  ): Promise<T> {
    this.startTiming(name);
    try {
      const result = await fn();
      this.endTiming(name, tags);
      return result;
    } catch (error) {
      this.endTiming(name, { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Measure a synchronous function execution time
   */
  measure<T>(name: string, fn: () => T, tags?: Record<string, string>): T {
    this.startTiming(name);
    try {
      const result = fn();
      this.endTiming(name, tags);
      return result;
    } catch (error) {
      this.endTiming(name, { ...tags, error: 'true' });
      throw error;
    }
  }

  /**
   * Record a custom metric
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);
    logger.debug(`Metric recorded: ${metric.name} = ${metric.value}${metric.unit}`, {
      metric,
    });
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear all metrics
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Log Web Vitals (Core Web Vitals)
   */
  logWebVitals(): void {
    if (typeof window === 'undefined') return;

    // Use the Performance Observer API to capture metrics
    try {
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        if (lastEntry) {
          this.recordMetric({
            name: 'LCP',
            value: lastEntry.startTime,
            unit: 'ms',
            timestamp: Date.now(),
          });
        }
      });
      lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });

      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          // Cast to PerformanceEntry with processingStart
          const fidEntry = entry as PerformanceEntry & { processingStart?: number };
          if (fidEntry.processingStart) {
            this.recordMetric({
              name: 'FID',
              value: fidEntry.processingStart - fidEntry.startTime,
              unit: 'ms',
              timestamp: Date.now(),
            });
          }
        });
      });
      fidObserver.observe({ type: 'first-input', buffered: true });

      // Cumulative Layout Shift
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const clsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
          if (!clsEntry.hadRecentInput && clsEntry.value) {
            clsValue += clsEntry.value;
          }
        }
        this.recordMetric({
          name: 'CLS',
          value: clsValue,
          unit: 's',
          timestamp: Date.now(),
        });
      });
      clsObserver.observe({ type: 'layout-shift', buffered: true });

      // Log page load timing
      window.addEventListener('load', () => {
        setTimeout(() => {
          const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (navigation) {
            this.recordMetric({
              name: 'page_load_time',
              value: navigation.loadEventEnd - navigation.startTime,
              unit: 'ms',
              timestamp: Date.now(),
            });
            this.recordMetric({
              name: 'dom_content_loaded',
              value: navigation.domContentLoadedEventEnd - navigation.startTime,
              unit: 'ms',
              timestamp: Date.now(),
            });
            this.recordMetric({
              name: 'first_paint',
              value: navigation.responseStart - navigation.startTime,
              unit: 'ms',
              timestamp: Date.now(),
            });
          }

          logger.info('Page load performance metrics recorded', {
            metrics: this.getMetrics().filter(m => 
              m.name.startsWith('page_') || 
              m.name === 'LCP' || 
              m.name === 'FID' || 
              m.name === 'CLS'
            ),
          });
        }, 0);
      });
    } catch (error) {
      // Performance Observer might not be available
      logger.debug('Performance Observer not available', { error });
    }
  }
}

// ============================================
// Singleton instance
// ============================================

let performanceTracker: PerformanceTracker | null = null;

export function getPerformanceTracker(): PerformanceTracker {
  if (!performanceTracker) {
    performanceTracker = new PerformanceTracker();
    
    // Initialize Web Vitals tracking on client
    if (typeof window !== 'undefined') {
      performanceTracker.logWebVitals();
    }
  }
  return performanceTracker;
}

// ============================================
// Convenience functions
// ============================================

export const perf = {
  startTiming: (name: string) => getPerformanceTracker().startTiming(name),
  endTiming: (name: string, tags?: Record<string, string>) => 
    getPerformanceTracker().endTiming(name, tags),
  measureAsync: <T>(name: string, fn: () => Promise<T>, tags?: Record<string, string>) =>
    getPerformanceTracker().measureAsync(name, fn, tags),
  measure: <T>(name: string, fn: () => T, tags?: Record<string, string>) =>
    getPerformanceTracker().measure(name, fn, tags),
  recordMetric: (metric: PerformanceMetric) => 
    getPerformanceTracker().recordMetric(metric),
  getMetrics: () => getPerformanceTracker().getMetrics(),
};

export default perf;
