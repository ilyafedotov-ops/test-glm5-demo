import { Injectable } from "@nestjs/common";
import { MonitoringService } from "./monitoring.service";

export interface MetricEntry {
  name: string;
  value: number;
  type: "counter" | "gauge" | "histogram";
  tags?: Record<string, string>;
}

export interface MetricsResponse {
  timestamp: string;
  metrics: MetricEntry[];
  histograms: Record<string, { count: number; min: number; max: number; mean: number; p95: number; p99: number } | null>;
}

@Injectable()
export class MetricsService {
  constructor(private readonly monitoringService: MonitoringService) {}

  /**
   * Get metrics in Prometheus exposition format
   */
  getPrometheusMetrics(): string {
    const lines: string[] = [];

    // Add counters
    const counters = this.monitoringService.getCounters();
    counters.forEach((value, key) => {
      const { name, tags } = this.parseMetricKey(key);
      const labels = this.formatLabels(tags);
      lines.push(`# TYPE ${name} counter`);
      lines.push(`${name}${labels} ${value}`);
    });

    // Add gauges
    const gauges = this.monitoringService.getGauges();
    gauges.forEach((value, key) => {
      const { name, tags } = this.parseMetricKey(key);
      const labels = this.formatLabels(tags);
      lines.push(`# TYPE ${name} gauge`);
      lines.push(`${name}${labels} ${value}`);
    });

    // Add histogram summaries
    const histograms = this.monitoringService.getHistograms();
    histograms.forEach((_, key) => {
      const { name, tags } = this.parseMetricKey(key);
      const stats = this.monitoringService.getHistogramStats(name, tags);

      if (stats) {
        const labels = this.formatLabels(tags);
        lines.push(`# TYPE ${name} histogram`);
        lines.push(`${name}_count${labels} ${stats.count}`);
        lines.push(`${name}_sum${labels} ${stats.mean * stats.count}`);
        lines.push(`${name}{${this.formatLabelsStr({ ...tags, le: "0.01" })}} ${Math.floor(stats.count * 0.01)}`);
        lines.push(`${name}{${this.formatLabelsStr({ ...tags, le: "0.05" })}} ${Math.floor(stats.count * 0.05)}`);
        lines.push(`${name}{${this.formatLabelsStr({ ...tags, le: "0.1" })}} ${Math.floor(stats.count * 0.1)}`);
        lines.push(`${name}{${this.formatLabelsStr({ ...tags, le: "0.5" })}} ${Math.floor(stats.count * 0.5)}`);
        lines.push(`${name}{${this.formatLabelsStr({ ...tags, le: "0.9" })}} ${Math.floor(stats.count * 0.9)}`);
        lines.push(`${name}{${this.formatLabelsStr({ ...tags, le: "0.95" })}} ${Math.floor(stats.count * 0.95)}`);
        lines.push(`${name}{${this.formatLabelsStr({ ...tags, le: "0.99" })}} ${stats.count}`);
        lines.push(`${name}{${this.formatLabelsStr({ ...tags, le: "+Inf" })}} ${stats.count}`);
      }
    });

    // Add process metrics
    lines.push("");
    lines.push("# Process metrics");
    const memUsage = process.memoryUsage();
    lines.push(`# TYPE process_heap_bytes gauge`);
    lines.push(`process_heap_bytes ${memUsage.heapUsed}`);
    lines.push(`# TYPE process_heap_total_bytes gauge`);
    lines.push(`process_heap_total_bytes ${memUsage.heapTotal}`);
    lines.push(`# TYPE process_resident_memory_bytes gauge`);
    lines.push(`process_resident_memory_bytes ${memUsage.rss}`);
    lines.push(`# TYPE process_uptime_seconds gauge`);
    lines.push(`process_uptime_seconds ${process.uptime()}`);

    return lines.join("\n");
  }

  /**
   * Get metrics in JSON format
   */
  getJsonMetrics(): MetricsResponse {
    const metrics: MetricEntry[] = [];

    // Collect counters
    const counters = this.monitoringService.getCounters();
    counters.forEach((value, key) => {
      const { name, tags } = this.parseMetricKey(key);
      metrics.push({ name, value, type: "counter", tags });
    });

    // Collect gauges
    const gauges = this.monitoringService.getGauges();
    gauges.forEach((value, key) => {
      const { name, tags } = this.parseMetricKey(key);
      metrics.push({ name, value, type: "gauge", tags });
    });

    // Collect histogram summaries
    const histograms = this.monitoringService.getHistograms();
    const histogramSummaries: Record<string, { count: number; min: number; max: number; mean: number; p95: number; p99: number } | null> = {};

    histograms.forEach((_, key) => {
      const { name, tags } = this.parseMetricKey(key);
      const stats = this.monitoringService.getHistogramStats(name, tags);
      histogramSummaries[name] = stats;
    });

    return {
      timestamp: new Date().toISOString(),
      metrics,
      histograms: histogramSummaries,
    };
  }

  /**
   * Parse metric key back into name and tags
   */
  private parseMetricKey(key: string): { name: string; tags: Record<string, string> } {
    const match = key.match(/^([^{]+)(?:\{(.+)\})?$/);
    if (!match) return { name: key, tags: {} };

    const name = match[1] ?? key;
    const tagsStr = match[2];

    if (!tagsStr) return { name, tags: {} };

    const tags: Record<string, string> = {};
    tagsStr.split(",").forEach((pair) => {
      const [k, v] = pair.split("=");
      if (k && v) {
        tags[k] = v;
      }
    });

    return { name, tags };
  }

  /**
   * Format labels for Prometheus
   */
  private formatLabels(tags?: Record<string, string>): string {
    if (!tags || Object.keys(tags).length === 0) return "";
    return `{${this.formatLabelsStr(tags)}}`;
  }

  private formatLabelsStr(tags: Record<string, string>): string {
    return Object.entries(tags)
      .map(([k, v]) => `${k}="${v}"`)
      .join(",");
  }
}
