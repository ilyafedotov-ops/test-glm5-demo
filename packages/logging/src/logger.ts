import pino, { type Logger as PinoLogger, type LoggerOptions } from 'pino';
import type {
  LoggerConfig,
  LogLevel,
  HttpContext,
  UserContext,
  BrowserContext,
  ChildLoggerOptions,
} from './types';
import { serializeError, serializeHttpContext, serializeUserContext, formatDuration } from './formatters';
import { generateCorrelationId, generateTraceId, generateSpanId } from './middleware/correlation-id';
import { contextStore, type LogContext } from './middleware/context';

/**
 * Get environment variable with type safety
 */
function getEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Default log levels
 */
const DEFAULT_LEVEL: LogLevel = (getEnv('LOG_LEVEL') as LogLevel) || 'info';

/**
 * Fields to redact by default
 */
const DEFAULT_REDACT_FIELDS = [
  'password',
  'passwordHash',
  'token',
  'accessToken',
  'refreshToken',
  'apiKey',
  'api_key',
  'secret',
  'authorization',
  'cookie',
];

/**
 * Create a Pino logger configuration
 */
function createPinoConfig(config: LoggerConfig): LoggerOptions {
  const isDevelopment = config.environment === 'development' || getEnv('NODE_ENV') === 'development';

  return {
    level: config.level || DEFAULT_LEVEL,
    redact: {
      paths: [...DEFAULT_REDACT_FIELDS, ...(config.redactFields || [])],
      censor: '[REDACTED]',
    },
    formatters: {
      level: (label) => ({ level: label }),
      bindings: () => ({}),
    },
    timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
    ...(config.prettyPrint || isDevelopment
      ? {
          transport: {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          },
        }
      : {}),
  };
}

/**
 * Main Logger class
 */
export class Logger {
  private pino: PinoLogger;
  private config: LoggerConfig;
  private baseContext: Record<string, unknown>;

  constructor(config: LoggerConfig) {
    this.config = {
      environment: (getEnv('NODE_ENV') as LoggerConfig['environment']) || 'development',
      level: DEFAULT_LEVEL,
      includeStackTrace: true,
      prettyPrint: getEnv('NODE_ENV') !== 'production',
      ...config,
    };

    this.pino = pino(createPinoConfig(this.config));
    
    this.baseContext = {
      service: this.config.service,
      version: this.config.version,
      environment: this.config.environment,
      ...(this.config.metadata || {}),
    };
  }

  /**
   * Create a child logger with additional context
   */
  child(options: ChildLoggerOptions = {}): Logger {
    const childContext = { ...options };
    
    return new Logger({
      ...this.config,
      metadata: {
        ...this.config.metadata,
        ...childContext,
      },
    });
  }

  /**
   * Create a logger bound to a request context
   */
  withContext(contextId: string, fn: () => void): void {
    const context: LogContext = {
      correlationId: generateCorrelationId(),
      traceId: generateTraceId(),
      spanId: generateSpanId(),
    };
    
    contextStore.run(contextId, context, fn);
  }

  /**
   * Get current context
   */
  private getContext(): LogContext | undefined {
    return contextStore.get();
  }

  /**
   * Build log entry
   */
  private buildEntry(
    level: LogLevel,
    message: string,
    additionalContext?: Record<string, unknown>
  ): Record<string, unknown> {
    const context = this.getContext();
    
    const entry: Record<string, unknown> = {
      ...this.baseContext,
      level,
      message,
      timestamp: new Date().toISOString(),
    };

    // Enrich with request context
    if (context) {
      if (context['correlationId']) entry['correlationId'] = context['correlationId'];
      if (context['traceId']) entry['traceId'] = context['traceId'];
      if (context['spanId']) entry['spanId'] = context['spanId'];
      if (context['userId']) entry['userId'] = context['userId'];
      if (context['user']) entry['user'] = context['user'];
      if (context['http']) entry['http'] = context['http'];
      if (context['browser']) entry['browser'] = context['browser'];
      if (context['metadata']) {
        const existingMetadata = entry['metadata'] as Record<string, unknown> | undefined;
        entry['metadata'] = { ...(existingMetadata || {}), ...context['metadata'] };
      }
    }

    // Add additional context
    if (additionalContext) {
      Object.assign(entry, additionalContext);
    }

    return entry;
  }

  // ============================================
  // Core logging methods
  // ============================================

  trace(message: string, context?: Record<string, unknown>): void {
    this.pino.trace(this.buildEntry('trace', message, context));
  }

  debug(message: string, context?: Record<string, unknown>): void {
    this.pino.debug(this.buildEntry('debug', message, context));
  }

  info(message: string, context?: Record<string, unknown>): void {
    this.pino.info(this.buildEntry('info', message, context));
  }

  warn(message: string, context?: Record<string, unknown>): void {
    this.pino.warn(this.buildEntry('warn', message, context));
  }

  error(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const entry = this.buildEntry('error', message, context);
    if (error && this.config.includeStackTrace) {
      entry['error'] = serializeError(error);
    }
    this.pino.error(entry);
  }

  fatal(message: string, error?: unknown, context?: Record<string, unknown>): void {
    const entry = this.buildEntry('fatal', message, context);
    if (error && this.config.includeStackTrace) {
      entry['error'] = serializeError(error);
    }
    this.pino.fatal(entry);
  }

  // ============================================
  // Convenience methods
  // ============================================

  /**
   * Log HTTP request
   */
  logRequest(
    method: string,
    url: string,
    context?: Partial<HttpContext>
  ): { end: (statusCode: number) => void } {
    const startTime = Date.now();
    
    this.info(`HTTP Request: ${method} ${url}`, {
      http: serializeHttpContext(method, url, context),
    });

    return {
      end: (statusCode: number) => {
        const duration = formatDuration(startTime);
        const level: LogLevel = statusCode >= 500 ? 'error' : statusCode >= 400 ? 'warn' : 'info';
        
        this[level](`HTTP Response: ${method} ${url} ${statusCode}`, {
          http: serializeHttpContext(method, url, {
            ...context,
            statusCode,
            duration,
          }),
        });
      },
    };
  }

  /**
   * Log with context (for NestJS compatibility)
   */
  log(message: string, context?: string): void {
    this.info(message, { context });
  }

  /**
   * Verbose log (alias for debug)
   */
  verbose(message: string, context?: string): void {
    this.debug(message, { context });
  }

  // ============================================
  // Context setters
  // ============================================

  /**
   * Set user context for current request
   */
  setUser(user: UserContext): void {
    contextStore.update({
      userId: user.id,
      user: serializeUserContext(user),
    });
  }

  /**
   * Set HTTP context
   */
  setHttpContext(http: HttpContext): void {
    contextStore.update({ http });
  }

  /**
   * Set browser context
   */
  setBrowserContext(browser: BrowserContext): void {
    contextStore.update({ browser });
  }

  /**
   * Add metadata to context
   */
  addMetadata(metadata: Record<string, unknown>): void {
    contextStore.addMetadata(metadata);
  }

  // ============================================
  // Static factory methods
  // ============================================

  /**
   * Create a logger for a specific service
   */
  static create(service: string, config?: Partial<LoggerConfig>): Logger {
    return new Logger({
      service,
      ...config,
    });
  }
}

/**
 * Create a default logger instance
 */
export function createLogger(config: LoggerConfig): Logger {
  return new Logger(config);
}
