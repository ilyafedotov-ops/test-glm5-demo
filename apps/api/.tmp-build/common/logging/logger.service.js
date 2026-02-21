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
var LoggerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggerService = void 0;
const common_1 = require("@nestjs/common");
const logging_1 = require("@nexusops/logging");
function getEnv(key) {
    return process.env[key];
}
let LoggerService = class LoggerService extends common_1.ConsoleLogger {
    static { LoggerService_1 = this; }
    nexusLogger;
    static instance;
    constructor() {
        super();
        const config = {
            service: 'nexusops-api',
            version: getEnv('npm_package_version') || '1.0.0',
            environment: getEnv('NODE_ENV') || 'development',
            level: getEnv('LOG_LEVEL') || 'info',
            prettyPrint: getEnv('NODE_ENV') !== 'production',
            includeStackTrace: true,
        };
        this.nexusLogger = new logging_1.Logger(config);
        LoggerService_1.instance = this;
    }
    static getInstance() {
        if (!LoggerService_1.instance) {
            LoggerService_1.instance = new LoggerService_1();
        }
        return LoggerService_1.instance;
    }
    getNexusLogger() {
        return this.nexusLogger;
    }
    log(message, context) {
        this.nexusLogger.info(message, { context });
    }
    error(message, trace, context) {
        this.nexusLogger.error(message, trace ? new Error(trace) : undefined, { context });
    }
    warn(message, context) {
        this.nexusLogger.warn(message, { context });
    }
    debug(message, context) {
        this.nexusLogger.debug(message, { context });
    }
    verbose(message, context) {
        this.nexusLogger.trace(message, { context });
    }
    info(message, context) {
        this.nexusLogger.info(message, context);
    }
    logRequest(method, url, context) {
        return this.nexusLogger.logRequest(method, url, context);
    }
    logEvent(event, data) {
        this.nexusLogger.info(`Event: ${event}`, { event, ...data });
    }
    setUser(userId, email, organizationId) {
        this.nexusLogger.setUser({
            id: userId,
            email,
            organizationId,
        });
    }
    setCorrelationId(correlationId) {
        this.nexusLogger.addMetadata({ correlationId });
    }
    addMetadata(metadata) {
        this.nexusLogger.addMetadata(metadata);
    }
    initializeCorrelationId(headers) {
        const correlationId = (0, logging_1.getOrCreateCorrelationId)(headers);
        this.setCorrelationId(correlationId);
        return correlationId;
    }
};
exports.LoggerService = LoggerService;
exports.LoggerService = LoggerService = LoggerService_1 = __decorate([
    (0, common_1.Injectable)({ scope: common_1.Scope.DEFAULT }),
    __metadata("design:paramtypes", [])
], LoggerService);
//# sourceMappingURL=logger.service.js.map