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
exports.CorrelationMiddleware = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("../logging/logger.service");
const logging_1 = require("@nexusops/logging");
let CorrelationMiddleware = class CorrelationMiddleware {
    constructor() { }
    use(req, res, next) {
        const logger = logger_service_1.LoggerService.getInstance();
        const headers = req.headers;
        const correlationId = (0, logging_1.getOrCreateCorrelationId)(headers);
        const traceId = headers['x-trace-id'] || (0, logging_1.generateTraceId)();
        const spanId = (0, logging_1.generateSpanId)();
        req['correlationId'] = correlationId;
        req['traceId'] = traceId;
        req['spanId'] = spanId;
        logger.setCorrelationId(correlationId);
        logger.addMetadata({
            traceId,
            spanId,
        });
        res.setHeader('x-correlation-id', correlationId);
        res.setHeader('x-trace-id', traceId);
        logger.getNexusLogger().debug(`Request started: ${req.method} ${req.originalUrl}`, {
            correlationId,
            traceId,
            spanId,
        });
        next();
    }
};
exports.CorrelationMiddleware = CorrelationMiddleware;
exports.CorrelationMiddleware = CorrelationMiddleware = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CorrelationMiddleware);
//# sourceMappingURL=correlation.middleware.js.map