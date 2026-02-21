"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var LoggingModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingModule = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const logger_service_1 = require("./logger.service");
const logging_interceptor_1 = require("./logging.interceptor");
const logging_filter_1 = require("./logging.filter");
const defaultOptions = {
    enableHttpLogging: true,
    enableExceptionLogging: true,
    interceptorOptions: {
        logBody: false,
        logHeaders: false,
        logResponseBody: false,
        maxBodyLength: 1000,
        excludePaths: [],
        healthCheckPaths: ['/health', '/api/health', '/metrics'],
    },
};
let LoggingModule = LoggingModule_1 = class LoggingModule {
    static register(options = {}) {
        const mergedOptions = { ...defaultOptions, ...options };
        const providers = [logger_service_1.LoggerService];
        if (mergedOptions.enableHttpLogging) {
            providers.push({
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            });
            providers.push({
                provide: 'LOGGING_OPTIONS',
                useValue: mergedOptions.interceptorOptions,
            });
        }
        if (mergedOptions.enableExceptionLogging) {
            providers.push({
                provide: core_1.APP_FILTER,
                useClass: logging_filter_1.LoggingExceptionFilter,
            });
        }
        return {
            module: LoggingModule_1,
            providers,
            exports: [logger_service_1.LoggerService],
            global: true,
        };
    }
    static registerAsync(options) {
        const providers = [
            logger_service_1.LoggerService,
            {
                provide: 'LOGGING_OPTIONS',
                useFactory: async (...args) => {
                    const moduleOptions = await options.useFactory(...args);
                    return { ...defaultOptions.interceptorOptions, ...moduleOptions.interceptorOptions };
                },
                inject: options.inject ?? [],
            },
            {
                provide: core_1.APP_INTERCEPTOR,
                useClass: logging_interceptor_1.LoggingInterceptor,
            },
            {
                provide: core_1.APP_FILTER,
                useClass: logging_filter_1.LoggingExceptionFilter,
            },
        ];
        return {
            module: LoggingModule_1,
            providers,
            exports: [logger_service_1.LoggerService],
            global: true,
        };
    }
};
exports.LoggingModule = LoggingModule;
exports.LoggingModule = LoggingModule = LoggingModule_1 = __decorate([
    (0, common_1.Global)(),
    (0, common_1.Module)({})
], LoggingModule);
//# sourceMappingURL=logging.module.js.map