import { Module, Global, DynamicModule, Provider, InjectionToken, OptionalFactoryDependency } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { LoggerService } from './logger.service';
import { LoggingInterceptor, LoggingInterceptorOptions } from './logging.interceptor';
import { LoggingExceptionFilter } from './logging.filter';

/**
 * Options for the LoggingModule
 */
export interface LoggingModuleOptions {
  /** Enable HTTP request/response logging */
  enableHttpLogging?: boolean;
  /** Enable global exception logging */
  enableExceptionLogging?: boolean;
  /** Options for the logging interceptor */
  interceptorOptions?: LoggingInterceptorOptions;
}

const defaultOptions: LoggingModuleOptions = {
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

/**
 * Global logging module that provides structured logging
 */
@Global()
@Module({})
export class LoggingModule {
  /**
   * Register the logging module with options
   */
  static register(options: Partial<LoggingModuleOptions> = {}): DynamicModule {
    const mergedOptions = { ...defaultOptions, ...options };
    const providers: Provider[] = [LoggerService];

    // Add HTTP logging interceptor
    if (mergedOptions.enableHttpLogging) {
      providers.push({
        provide: APP_INTERCEPTOR,
        useClass: LoggingInterceptor,
      });
      providers.push({
        provide: 'LOGGING_OPTIONS',
        useValue: mergedOptions.interceptorOptions,
      });
    }

    // Add exception filter
    if (mergedOptions.enableExceptionLogging) {
      providers.push({
        provide: APP_FILTER,
        useClass: LoggingExceptionFilter,
      });
    }

    return {
      module: LoggingModule,
      providers,
      exports: [LoggerService],
      global: true,
    };
  }

  /**
   * Register the logging module asynchronously
   */
  static registerAsync(options: {
    useFactory: (...args: unknown[]) => Promise<Partial<LoggingModuleOptions>> | Partial<LoggingModuleOptions>;
    inject?: Array<InjectionToken | OptionalFactoryDependency>;
  }): DynamicModule {
    const providers: Provider[] = [
      LoggerService,
      {
        provide: 'LOGGING_OPTIONS',
        useFactory: async (...args: unknown[]) => {
          const moduleOptions = await options.useFactory(...args);
          return { ...defaultOptions.interceptorOptions, ...moduleOptions.interceptorOptions };
        },
        inject: options.inject ?? [],
      },
      {
        provide: APP_INTERCEPTOR,
        useClass: LoggingInterceptor,
      },
      {
        provide: APP_FILTER,
        useClass: LoggingExceptionFilter,
      },
    ];

    return {
      module: LoggingModule,
      providers,
      exports: [LoggerService],
      global: true,
    };
  }
}
