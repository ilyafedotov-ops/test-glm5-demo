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
exports.LoggingExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const logger_service_1 = require("./logger.service");
let LoggingExceptionFilter = class LoggingExceptionFilter {
    constructor() { }
    catch(exception, host) {
        const logger = logger_service_1.LoggerService.getInstance();
        const ctx = host.switchToHttp();
        const request = ctx.getRequest();
        const response = ctx.getResponse();
        const { method, url, ip, headers } = request;
        const userAgent = headers['user-agent'] || '';
        const timestamp = new Date().toISOString();
        let statusCode;
        let message;
        let errorName;
        let errorDetails;
        if (exception instanceof common_1.HttpException) {
            statusCode = exception.getStatus();
            const exceptionResponse = exception.getResponse();
            if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
                const responseObj = exceptionResponse;
                message = responseObj['message'] || exception.message;
                errorName = responseObj['error'] || exception.name;
                errorDetails = responseObj['details'];
            }
            else {
                message = exception.message;
                errorName = exception.name;
            }
        }
        else if (exception instanceof Error) {
            statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = exception.message;
            errorName = exception.name;
        }
        else {
            statusCode = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
            message = 'Internal server error';
            errorName = 'UnknownError';
        }
        const errorResponse = {
            statusCode,
            message,
            error: errorName,
            timestamp,
            path: url,
        };
        const correlationId = request.headers['x-correlation-id'];
        if (correlationId) {
            errorResponse.correlationId = correlationId;
        }
        if (errorDetails) {
            errorResponse.details = errorDetails;
        }
        const logContext = {
            http: {
                method,
                url,
                statusCode,
                ip,
                userAgent,
                correlationId,
            },
            error: {
                name: errorName,
                message,
                details: errorDetails,
            },
        };
        if (statusCode >= 500) {
            logger.getNexusLogger().error(`Exception: ${method} ${url} ${statusCode} - ${message}`, exception instanceof Error ? exception : new Error(String(exception)), logContext);
        }
        else if (statusCode >= 400) {
            logger.getNexusLogger().warn(`Client Error: ${method} ${url} ${statusCode} - ${message}`, logContext);
        }
        if (statusCode >= 500 && process.env['NODE_ENV'] === 'production') {
            errorResponse.message = 'Internal server error';
            delete errorResponse.details;
        }
        response.status(statusCode).json(errorResponse);
    }
};
exports.LoggingExceptionFilter = LoggingExceptionFilter;
exports.LoggingExceptionFilter = LoggingExceptionFilter = __decorate([
    (0, common_1.Catch)(),
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], LoggingExceptionFilter);
//# sourceMappingURL=logging.filter.js.map