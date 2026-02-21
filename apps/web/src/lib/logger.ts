/**
 * Frontend Logger for NexusOps Web
 * 
 * This logger works in both client and server contexts:
 * - Server-side (SSR/SSG): Uses @nexusops/logging directly
 * - Client-side: Sends logs to /api/logs endpoint
 */

import type { LogLevel, BrowserContext, UserContext } from '@nexusops/logging';

// ============================================
// Types
// ============================================

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service?: string;
  version?: string;
  environment?: string;
  context?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
  browser?: BrowserContext;
  user?: UserContext;
  correlationId?: string;
}

interface LoggerConfig {
  service: string;
  version?: string;
  environment?: string;
  level?: LogLevel;
  endpoint?: string;
}

// ============================================
// Helper functions
// ============================================

/**
 * Check if we're running on the server
 */
const isServer = (): boolean => {
  return typeof window === 'undefined';
};

/**
 * Get browser context information
 */
const getBrowserContext = (): BrowserContext | undefined => {
  if (isServer()) return undefined;
  
  return {
    url: window.location.href,
    userAgent: navigator.userAgent,
    viewport: {
      width: window.innerWidth,
      height: window.innerHeight,
    },
    language: navigator.language,
  };
};

/**
 * Get environment variable (works in both client and server)
 */
function getEnv(key: string): string | undefined {
  if (isServer()) {
    return process.env[key];
  }
  // Client-side env vars in Next.js are prefixed with NEXT_PUBLIC_
  // For now, just return undefined for client-side env access
  return undefined;
}

/**
 * Format a log entry
 */
function createLogEntry(
  level: LogLevel,
  message: string,
  config: LoggerConfig,
  options?: {
    context?: string;
    error?: Error;
    metadata?: Record<string, unknown>;
    user?: UserContext;
    correlationId?: string;
  }
): LogEntry {
  return {
    level,
    message,
    timestamp: new Date().toISOString(),
    service: config.service,
    version: config.version,
    environment: config.environment,
    context: options?.context,
    browser: getBrowserContext(),
    correlationId: options?.correlationId,
    user: options?.user,
    metadata: options?.metadata,
    error: options?.error
      ? {
          name: options.error.name,
          message: options.error.message,
          stack: options.error.stack,
        }
      : undefined,
  };
}

// ============================================
// Server-side logger (using @nexusops/logging)
// ============================================

let serverLogger: ReturnType<typeof import('@nexusops/logging').createLogger> | null = null;

function getServerLogger(config: LoggerConfig) {
  if (!serverLogger) {
    // Dynamically import to avoid bundling in client
    const { createLogger } = require('@nexusops/logging');
    serverLogger = createLogger({
      service: config.service,
      version: config.version,
      environment: config.environment || 'development',
      level: config.level || 'info',
      prettyPrint: process.env['NODE_ENV'] !== 'production',
    });
  }
  return serverLogger;
}

// ============================================
// Client-side logger (sends to API endpoint)
// ============================================

async function sendLogToServer(entry: LogEntry, endpoint: string): Promise<void> {
  try {
    // Use sendBeacon for better reliability during page unload
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(entry)], { type: 'application/json' });
      navigator.sendBeacon(endpoint, blob);
    } else {
      // Fallback to fetch
      await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
        keepalive: true,
      });
    }
  } catch (error) {
    // Fallback to console if sending fails
    console.error('Failed to send log:', error);
  }
}

// ============================================
// Console fallback for development
// ============================================

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 0,
  debug: 1,
  info: 2,
  warn: 3,
  error: 4,
  fatal: 5,
};

const LEVEL_STYLES: Record<LogLevel, string> = {
  trace: 'color: gray',
  debug: 'color: cyan',
  info: 'color: green',
  warn: 'color: orange',
  error: 'color: red',
  fatal: 'color: red; font-weight: bold',
};

function consoleLog(entry: LogEntry, minLevel: LogLevel): void {
  const entryLevel = LOG_LEVELS[entry.level];
  const minLevelValue = LOG_LEVELS[minLevel];
  
  if (entryLevel < minLevelValue) return;
  
  const style = LEVEL_STYLES[entry.level];
  const timestamp = entry.timestamp.slice(11, 23); // HH:mm:ss.SSS
  
  const prefix = `%c[${timestamp}] [${entry.level.toUpperCase()}]`;
  
  const args: unknown[] = [prefix, style];
  
  if (entry.context) {
    args.push(`[${entry.context}]`);
  }
  
  args.push(entry.message);
  
  if (entry.metadata && Object.keys(entry.metadata).length > 0) {
    args.push(entry.metadata);
  }
  
  if (entry.error) {
    args.push('\nError:', entry.error.name, entry.error.message);
    if (entry.error.stack) {
      args.push('\n' + entry.error.stack);
    }
  }
  
  // Use appropriate console method
  switch (entry.level) {
    case 'fatal':
    case 'error':
      console.error(...args);
      break;
    case 'warn':
      console.warn(...args);
      break;
    case 'debug':
    case 'trace':
      console.debug(...args);
      break;
    default:
      console.log(...args);
  }
}

// ============================================
// Main Logger Class
// ============================================

export class FrontendLogger {
  private config: LoggerConfig;
  private user?: UserContext;
  private correlationId?: string;
  private enabled: boolean = true;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      service: 'nexusops-web',
      version: getEnv('npm_package_version') || '1.0.0',
      environment: getEnv('NODE_ENV') || 'development',
      level: (getEnv('LOG_LEVEL') as LogLevel) || 'info',
      endpoint: '/api/logs',
      ...config,
    };
    
    // Disable logging in test environment
    if (this.config.environment === 'test') {
      this.enabled = false;
    }
  }

  /**
   * Set user context for all subsequent logs
   */
  setUser(user: UserContext | undefined): void {
    this.user = user;
  }

  /**
   * Set correlation ID for request tracing
   */
  setCorrelationId(id: string | undefined): void {
    this.correlationId = id;
  }

  /**
   * Get the current correlation ID
   */
  getCorrelationId(): string | undefined {
    return this.correlationId;
  }

  /**
   * Core logging method
   */
  log(
    level: LogLevel,
    message: string,
    options?: {
      context?: string;
      error?: Error;
      metadata?: Record<string, unknown>;
    }
  ): void {
    if (!this.enabled) return;
    
    const entry = createLogEntry(level, message, this.config, {
      ...options,
      user: this.user,
      correlationId: this.correlationId,
    });

    if (isServer()) {
      // Server-side: use @nexusops/logging
      const serverLogger = getServerLogger(this.config);
      if (serverLogger) {
        const method = level === 'fatal' ? 'error' : level;
        serverLogger[method](message, {
          ...options?.metadata,
          context: options?.context,
          browser: entry.browser,
          user: entry.user,
          correlationId: entry.correlationId,
          error: entry.error,
        });
      }
    } else {
      // Client-side: console + send to server
      consoleLog(entry, this.config.level || 'info');
      
      // Send errors to server (and info if in production)
      if (
        LOG_LEVELS[level] >= LOG_LEVELS.error ||
        (this.config.environment === 'production' && LOG_LEVELS[level] >= LOG_LEVELS.info)
      ) {
        sendLogToServer(entry, this.config.endpoint || '/api/logs');
      }
    }
  }

  // ============================================
  // Convenience methods
  // ============================================

  trace(message: string, metadata?: Record<string, unknown>): void {
    this.log('trace', message, { metadata });
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.log('debug', message, { metadata });
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.log('info', message, { metadata });
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.log('warn', message, { metadata });
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    this.log('error', message, {
      error: error instanceof Error ? error : error ? new Error(String(error)) : undefined,
      metadata,
    });
  }

  fatal(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    this.log('fatal', message, {
      error: error instanceof Error ? error : error ? new Error(String(error)) : undefined,
      metadata,
    });
  }

  /**
   * Log with explicit context
   */
  logWithContext(
    level: LogLevel,
    message: string,
    context: string,
    metadata?: Record<string, unknown>
  ): void {
    this.log(level, message, { context, metadata });
  }

  /**
   * Log a user action
   */
  logAction(action: string, details?: Record<string, unknown>): void {
    this.info(`User action: ${action}`, {
      action,
      ...details,
    });
  }

  /**
   * Log performance timing
   */
  logPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.debug(`Performance: ${metric} = ${value}${unit}`, {
      performance: { metric, value, unit },
    });
  }

  /**
   * Log page view
   */
  logPageView(path: string): void {
    this.info('Page view', { page: path });
  }

  /**
   * Create a child logger with additional context
   */
  child(context: string): ContextLogger {
    return new ContextLogger(this, context);
  }
}

// ============================================
// Context Logger (for component-scoped logging)
// ============================================

class ContextLogger {
  private logger: FrontendLogger;
  private context: string;

  constructor(logger: FrontendLogger, context: string) {
    this.logger = logger;
    this.context = context;
  }

  trace(message: string, metadata?: Record<string, unknown>): void {
    this.logger.logWithContext('trace', message, this.context, metadata);
  }

  debug(message: string, metadata?: Record<string, unknown>): void {
    this.logger.logWithContext('debug', message, this.context, metadata);
  }

  info(message: string, metadata?: Record<string, unknown>): void {
    this.logger.logWithContext('info', message, this.context, metadata);
  }

  warn(message: string, metadata?: Record<string, unknown>): void {
    this.logger.logWithContext('warn', message, this.context, metadata);
  }

  error(message: string, error?: Error | unknown, metadata?: Record<string, unknown>): void {
    this.logger.log('error', message, {
      context: this.context,
      error: error instanceof Error ? error : error ? new Error(String(error)) : undefined,
      metadata,
    });
  }
}

// ============================================
// Singleton instance
// ============================================

let loggerInstance: FrontendLogger | null = null;

/**
 * Get the global logger instance
 */
export function getLogger(): FrontendLogger {
  if (!loggerInstance) {
    loggerInstance = new FrontendLogger();
  }
  return loggerInstance;
}

/**
 * Create a new logger instance with custom config
 */
export function createLogger(config?: Partial<LoggerConfig>): FrontendLogger {
  return new FrontendLogger(config);
}

// ============================================
// Export default instance
// ============================================

export const logger = getLogger();
export default logger;
