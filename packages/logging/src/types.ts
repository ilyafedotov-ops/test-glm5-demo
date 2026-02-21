/**
 * Log levels supported by the logger
 */
export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal';

/**
 * Environment type
 */
export type Environment = 'development' | 'staging' | 'production' | 'test';

/**
 * HTTP request/response context
 */
export interface HttpContext {
  method: string;
  url: string;
  statusCode?: number;
  duration?: number;
  userId?: string;
  userAgent?: string;
  ip?: string;
  requestId?: string;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
}

/**
 * Error information for logging
 */
export interface ErrorInfo {
  name: string;
  message: string;
  stack?: string;
  code?: string | number;
  details?: Record<string, unknown>;
}

/**
 * User context for logs
 */
export interface UserContext {
  id: string;
  email?: string;
  organizationId?: string;
  roles?: string[];
}

/**
 * Browser context (for frontend logging)
 */
export interface BrowserContext {
  url: string;
  userAgent: string;
  viewport?: {
    width: number;
    height: number;
  };
  language?: string;
}

/**
 * Logger configuration
 */
export interface LoggerConfig {
  /** Service name (e.g., 'nexusops-api', 'nexusops-web') */
  service: string;
  /** Service version */
  version?: string;
  /** Environment */
  environment?: Environment;
  /** Minimum log level */
  level?: LogLevel;
  /** Whether to include stack traces in errors */
  includeStackTrace?: boolean;
  /** Fields to redact from logs (e.g., ['password', 'token']) */
  redactFields?: string[];
  /** Whether to pretty print (for development) */
  prettyPrint?: boolean;
  /** Custom metadata to include in all logs */
  metadata?: Record<string, unknown>;
}

/**
 * Log entry structure
 */
export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  service: string;
  version?: string;
  environment?: Environment;
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  context?: string;
  message: string;
  http?: HttpContext;
  error?: ErrorInfo;
  user?: UserContext;
  browser?: BrowserContext;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

/**
 * Logger interface compatible with NestJS LoggerService
 */
export interface LoggerService {
  log(message: string, ...optionalParams: unknown[]): void;
  error(message: string, ...optionalParams: unknown[]): void;
  warn(message: string, ...optionalParams: unknown[]): void;
  debug?(message: string, ...optionalParams: unknown[]): void;
  verbose?(message: string, ...optionalParams: unknown[]): void;
}

/**
 * Child logger options
 */
export interface ChildLoggerOptions {
  correlationId?: string;
  traceId?: string;
  userId?: string;
  context?: string;
  [key: string]: unknown;
}
