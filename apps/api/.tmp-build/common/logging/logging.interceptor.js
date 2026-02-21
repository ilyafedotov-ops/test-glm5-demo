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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingInterceptor = void 0;
const common_1 = require("@nestjs/common");
const operators_1 = require("rxjs/operators");
const logger_service_1 = require("./logger.service");
const logging_1 = require("@nexusops/logging");
const DEFAULT_OPTIONS = {
    logBody: false,
    logHeaders: false,
    logResponseBody: false,
    maxBodyLength: 1000,
    excludePaths: [],
    healthCheckPaths: ['/health', '/api/health', '/metrics'],
};
let LoggingInterceptor = class LoggingInterceptor {
    options;
    constructor(options) {
        this.options = { ...DEFAULT_OPTIONS, ...options };
    }
    intercept(context, next) {
        const logger = logger_service_1.LoggerService.getInstance();
        const ctx = context.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || '';
        const startTime = Date.now();
        if (this.options.excludePaths?.some(path => url.startsWith(path))) {
            return next.handle();
        }
        const correlationId = (0, logging_1.getOrCreateCorrelationId)(headers);
        const traceId = (0, logging_1.generateTraceId)();
        logger.setCorrelationId(correlationId);
        logger.addMetadata({ traceId });
        const isHealthCheck = this.options.healthCheckPaths?.some(path => url.startsWith(path));
        const logLevel = isHealthCheck ? 'debug' : 'info';
        const requestLog = {
            http: {
                method,
                url,
                ip,
                userAgent,
                requestId: headers['x-request-id'],
            },
        };
        if (this.options.logBody && request.body) {
            const bodyStr = JSON.stringify(request.body);
            requestLog['http'] = {
                ...requestLog['http'],
                body: bodyStr.length > (this.options.maxBodyLength || 1000)
                    ? bodyStr.slice(0, this.options.maxBodyLength) + '...[truncated]'
                    : request.body,
            };
        }
        if (this.options.logHeaders) {
            const safeHeaders = { ...headers };
            delete safeHeaders['authorization'];
            delete safeHeaders['cookie'];
            requestLog['http'] = {
                ...requestLog['http'],
                headers: safeHeaders,
            };
        }
        if (logLevel === 'debug') {
            logger.getNexusLogger().debug(`--> ${method} ${url}`, requestLog);
        }
        else {
            logger.getNexusLogger().info(`--> ${method} ${url}`, requestLog);
        }
        return next.handle().pipe((0, operators_1.tap)({
            next: (data) => {
                const duration = Date.now() - startTime;
                const statusCode = response.statusCode;
                const responseLog = {
                    http: {
                        method,
                        url,
                        statusCode,
                        duration,
                        correlationId,
                    },
                };
                if (this.options.logResponseBody && data) {
                    const bodyStr = JSON.stringify(data);
                    responseLog['http'] = {
                        ...responseLog['http'],
                        body: bodyStr.length > (this.options.maxBodyLength || 1000)
                            ? bodyStr.slice(0, this.options.maxBodyLength) + '...[truncated]'
                            : data,
                    };
                }
                const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : logLevel;
                logger.getNexusLogger()[level](`<-- ${method} ${url} ${statusCode} (${duration}ms)`, responseLog);
            },
        }), (0, operators_1.catchError)((error) => {
            const duration = Date.now() - startTime;
            const statusCode = error instanceof Error && 'status' in error
                ? error.status
                : 500;
            logger.getNexusLogger().error(`<-- ${method} ${url} ${statusCode} (${duration}ms)`, error, {
                http: {
                    method,
                    url,
                    statusCode,
                    duration,
                    correlationId,
                },
            });
            throw error;
        }));
    }
};
exports.LoggingInterceptor = LoggingInterceptor;
exports.LoggingInterceptor = LoggingInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Optional)()),
    __param(0, (0, common_1.Inject)('LOGGING_OPTIONS')),
    __metadata("design:paramtypes", [Object])
], LoggingInterceptor);
//# sourceMappingURL=logging.interceptor.js.map