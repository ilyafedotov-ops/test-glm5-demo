import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
  Optional,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerService } from './logger.service';
import { getOrCreateCorrelationId, generateTraceId } from '@nexusops/logging';

/**
 * Options for the logging interceptor
 */
export interface LoggingInterceptorOptions {
  /** Log request body (be careful with sensitive data) */
  logBody?: boolean;
  /** Log request headers */
  logHeaders?: boolean;
  /** Log response body */
  logResponseBody?: boolean;
  /** Maximum body length to log */
  maxBodyLength?: number;
  /** Paths to exclude from logging */
  excludePaths?: string[];
  /** Health check paths to use debug level */
  healthCheckPaths?: string[];
}

const DEFAULT_OPTIONS: LoggingInterceptorOptions = {
  logBody: false,
  logHeaders: false,
  logResponseBody: false,
  maxBodyLength: 1000,
  excludePaths: [],
  healthCheckPaths: ['/health', '/api/health', '/metrics'],
};

/**
 * Interceptor that logs HTTP requests and responses
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly options: LoggingInterceptorOptions;

  constructor(
    @Optional() @Inject('LOGGING_OPTIONS') options?: Partial<LoggingInterceptorOptions>
  ) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const logger = LoggerService.getInstance();
    
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    // Skip excluded paths
    if (this.options.excludePaths?.some(path => url.startsWith(path))) {
      return next.handle();
    }

    // Generate or extract correlation ID
    const correlationId = getOrCreateCorrelationId(headers as Record<string, string | undefined>);
    const traceId = generateTraceId();

    // Initialize request context
    logger.setCorrelationId(correlationId);
    logger.addMetadata({ traceId });

    // Determine log level (debug for health checks)
    const isHealthCheck = this.options.healthCheckPaths?.some(path => url.startsWith(path));
    const logLevel = isHealthCheck ? 'debug' : 'info';

    // Build request log
    const requestLog: Record<string, unknown> = {
      http: {
        method,
        url,
        ip,
        userAgent,
        requestId: headers['x-request-id'],
      },
    };

    // Optionally log body
    if (this.options.logBody && request.body) {
      const bodyStr = JSON.stringify(request.body);
      requestLog['http'] = {
        ...requestLog['http'] as Record<string, unknown>,
        body: bodyStr.length > (this.options.maxBodyLength || 1000)
          ? bodyStr.slice(0, this.options.maxBodyLength) + '...[truncated]'
          : request.body,
      };
    }

    // Optionally log headers (excluding sensitive ones)
    if (this.options.logHeaders) {
      const safeHeaders = { ...headers };
      delete safeHeaders['authorization'];
      delete safeHeaders['cookie'];
      requestLog['http'] = {
        ...requestLog['http'] as Record<string, unknown>,
        headers: safeHeaders,
      };
    }

    // Log request
    if (logLevel === 'debug') {
      logger.getNexusLogger().debug(`--> ${method} ${url}`, requestLog);
    } else {
      logger.getNexusLogger().info(`--> ${method} ${url}`, requestLog);
    }

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const duration = Date.now() - startTime;
          const statusCode = response.statusCode;

          const responseLog: Record<string, unknown> = {
            http: {
              method,
              url,
              statusCode,
              duration,
              correlationId,
            },
          };

          // Optionally log response body
          if (this.options.logResponseBody && data) {
            const bodyStr = JSON.stringify(data);
            responseLog['http'] = {
              ...responseLog['http'] as Record<string, unknown>,
              body: bodyStr.length > (this.options.maxBodyLength || 1000)
                ? bodyStr.slice(0, this.options.maxBodyLength) + '...[truncated]'
                : data,
            };
          }

          const level = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : logLevel;
          logger.getNexusLogger()[level](`<-- ${method} ${url} ${statusCode} (${duration}ms)`, responseLog);
        },
      }),
      catchError((error: Error) => {
        const duration = Date.now() - startTime;
        const statusCode = error instanceof Error && 'status' in error
          ? (error as Error & { status: number }).status
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
      })
    );
  }
}
