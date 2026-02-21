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
exports.RelatedRecord = exports.TraceContext = void 0;
exports.toSystemRecordId = toSystemRecordId;
exports.parseSystemRecordId = parseSystemRecordId;
exports.toTraceContext = toTraceContext;
exports.buildRelatedRecords = buildRelatedRecords;
const swagger_1 = require("@nestjs/swagger");
class TraceContext {
    systemRecordId;
    correlationId;
    causationId;
    traceId;
}
exports.TraceContext = TraceContext;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Globally unique system record identifier (<entityType>:<entityId>)",
        example: "task:7f96f9d2-08e1-4f57-bd47-44918cc32296",
    }),
    __metadata("design:type", String)
], TraceContext.prototype, "systemRecordId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Request correlation ID shared across related operations" }),
    __metadata("design:type", String)
], TraceContext.prototype, "correlationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Parent action/event ID that caused this record change" }),
    __metadata("design:type", String)
], TraceContext.prototype, "causationId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Distributed tracing ID, if available" }),
    __metadata("design:type", String)
], TraceContext.prototype, "traceId", void 0);
class RelatedRecord {
    type;
    id;
    systemRecordId;
    relationship;
}
exports.RelatedRecord = RelatedRecord;
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Related entity type", example: "workflow" }),
    __metadata("design:type", String)
], RelatedRecord.prototype, "type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: "Related entity ID" }),
    __metadata("design:type", String)
], RelatedRecord.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: "Globally unique related record identifier (<entityType>:<entityId>)",
        example: "workflow:8e8d4efa-4d8f-43fd-9ebf-4f3e06cf60e4",
    }),
    __metadata("design:type", String)
], RelatedRecord.prototype, "systemRecordId", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({ description: "Meaning of the relationship" }),
    __metadata("design:type", String)
], RelatedRecord.prototype, "relationship", void 0);
function getStringValue(source, key) {
    if (!source) {
        return undefined;
    }
    const value = source[key];
    return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}
function toSystemRecordId(entityType, entityId) {
    const normalizedType = entityType?.trim().toLowerCase() || "entity";
    const normalizedId = entityId?.trim() || "unknown";
    return `${normalizedType}:${normalizedId}`;
}
function parseSystemRecordId(systemRecordId) {
    if (!systemRecordId) {
        return null;
    }
    const separatorIndex = systemRecordId.indexOf(":");
    if (separatorIndex <= 0 || separatorIndex >= systemRecordId.length - 1) {
        return null;
    }
    const type = systemRecordId.slice(0, separatorIndex).trim().toLowerCase();
    const id = systemRecordId.slice(separatorIndex + 1).trim();
    if (!type || !id) {
        return null;
    }
    return { type, id };
}
function toTraceContext(systemRecordId, ...sources) {
    const correlationId = sources
        .map((source) => getStringValue(source, "correlationId"))
        .find(Boolean);
    const causationId = sources
        .map((source) => getStringValue(source, "causationId"))
        .find(Boolean);
    const traceId = sources
        .map((source) => getStringValue(source, "traceId"))
        .find(Boolean);
    return {
        systemRecordId,
        correlationId,
        causationId,
        traceId,
    };
}
function buildRelatedRecords(records) {
    const unique = new Map();
    for (const record of records) {
        if (!record.id) {
            continue;
        }
        const systemRecordId = toSystemRecordId(record.type, record.id);
        const dedupeKey = `${record.relationship || ""}|${systemRecordId}`;
        if (!unique.has(dedupeKey)) {
            unique.set(dedupeKey, {
                type: record.type,
                id: record.id,
                systemRecordId,
                relationship: record.relationship,
            });
        }
    }
    return Array.from(unique.values());
}
//# sourceMappingURL=system-links.js.map