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
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsService = void 0;
const common_1 = require("@nestjs/common");
const monitoring_service_1 = require("./monitoring.service");
let MetricsService = class MetricsService {
    monitoringService;
    constructor(monitoringService) {
        this.monitoringService = monitoringService;
    }
    getPrometheusMetrics() {
        const lines = [];
        const counters = this.monitoringService.getCounters();
        counters.forEach((value, key) => {
            const { name, tags } = this.parseMetricKey(key);
            const labels = this.formatLabels(tags);
            lines.push(`# TYPE ${name} counter`);
            lines.push(`${name}${labels} ${value}`);
        });
        const gauges = this.monitoringService.getGauges();
        gauges.forEach((value, key) => {
            const { name, tags } = this.parseMetricKey(key);
            const labels = this.formatLabels(tags);
            lines.push(`# TYPE ${name} gauge`);
            lines.push(`${name}${labels} ${value}`);
        });
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
    getJsonMetrics() {
        const metrics = [];
        const counters = this.monitoringService.getCounters();
        counters.forEach((value, key) => {
            const { name, tags } = this.parseMetricKey(key);
            metrics.push({ name, value, type: "counter", tags });
        });
        const gauges = this.monitoringService.getGauges();
        gauges.forEach((value, key) => {
            const { name, tags } = this.parseMetricKey(key);
            metrics.push({ name, value, type: "gauge", tags });
        });
        const histograms = this.monitoringService.getHistograms();
        const histogramSummaries = {};
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
    parseMetricKey(key) {
        const match = key.match(/^([^{]+)(?:\{(.+)\})?$/);
        if (!match)
            return { name: key, tags: {} };
        const name = match[1] ?? key;
        const tagsStr = match[2];
        if (!tagsStr)
            return { name, tags: {} };
        const tags = {};
        tagsStr.split(",").forEach((pair) => {
            const [k, v] = pair.split("=");
            if (k && v) {
                tags[k] = v;
            }
        });
        return { name, tags };
    }
    formatLabels(tags) {
        if (!tags || Object.keys(tags).length === 0)
            return "";
        return `{${this.formatLabelsStr(tags)}}`;
    }
    formatLabelsStr(tags) {
        return Object.entries(tags)
            .map(([k, v]) => `${k}="${v}"`)
            .join(",");
    }
};
exports.MetricsService = MetricsService;
exports.MetricsService = MetricsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [monitoring_service_1.MonitoringService])
], MetricsService);
//# sourceMappingURL=metrics.service.js.map