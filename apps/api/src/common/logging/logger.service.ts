import { Injectable, Scope, ConsoleLogger } from '@nestjs/common';
import { Logger as NexusLogger, LoggerConfig, getOrCreateCorrelationId } from '@nexusops/logging';

/**
 * Helper to get environment variable
 */
function getEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * NestJS-compatible logger service using @nexusops/logging
 */
@Injectable({ scope: Scope.DEFAULT })
export class LoggerService extends ConsoleLogger {
  private nexusLogger: NexusLogger;
  private static instance: LoggerService;

  constructor() {
    super();
    
    const config: LoggerConfig = {
      service: 'nexusops-api',
      version: getEnv('npm_package_version') || '1.0.0',
      environment: (getEnv('NODE_ENV') as LoggerConfig['environment']) || 'development',
      level: (getEnv('LOG_LEVEL') as LoggerConfig['level']) || 'info',
      prettyPrint: getEnv('NODE_ENV') !== 'production',
      includeStackTrace: true,
    };

    this.nexusLogger = new NexusLogger(config);
    LoggerService.instance = this;
  }

  /**
   * Get the static instance of the logger
   */
  static getInstance(): LoggerService {
    if (!LoggerService.instance) {
      LoggerService.instance = new LoggerService();
    }
    return LoggerService.instance;
  }

  /**
   * Get the underlying Nexus logger
   */
  getNexusLogger(): NexusLogger {
    return this.nexusLogger;
  }

  /**
   * Log a message (NestJS LoggerService interface)
   */
  override log(message: string, context?: string): void {
    this.nexusLogger.info(message, { context });
  }

  /**
   * Log an error (NestJS LoggerService interface)
   */
  override error(message: string, trace?: string, context?: string): void {
    this.nexusLogger.error(message, trace ? new Error(trace) : undefined, { context });
  }

  /**
   * Log a warning (NestJS LoggerService interface)
   */
  override warn(message: string, context?: string): void {
    this.nexusLogger.warn(message, { context });
  }

  /**
   * Log a debug message (NestJS LoggerService interface)
   */
  override debug(message: string, context?: string): void {
    this.nexusLogger.debug(message, { context });
  }

  /**
   * Log a verbose message (NestJS LoggerService interface)
   */
  override verbose(message: string, context?: string): void {
    this.nexusLogger.trace(message, { context });
  }

  // ============================================
  // Extended logging methods
  // ============================================

  /**
   * Log with additional context
   */
  info(message: string, context?: Record<string, unknown>): void {
    this.nexusLogger.info(message, context);
  }

  /**
   * Log an HTTP request
   */
  logRequest(method: string, url: string, context?: Record<string, unknown>) {
    return this.nexusLogger.logRequest(method, url, context);
  }

  /**
   * Log a business event
   */
  logEvent(event: string, data?: Record<string, unknown>): void {
    this.nexusLogger.info(`Event: ${event}`, { event, ...data });
  }

  /**
   * Set user context for the current request
   */
  setUser(userId: string, email?: string, organizationId?: string): void {
    this.nexusLogger.setUser({
      id: userId,
      email,
      organizationId,
    });
  }

  /**
   * Set correlation ID for the current request
   */
  setCorrelationId(correlationId: string): void {
    this.nexusLogger.addMetadata({ correlationId });
  }

  /**
   * Add metadata to the current request context
   */
  addMetadata(metadata: Record<string, unknown>): void {
    this.nexusLogger.addMetadata(metadata);
  }

  /**
   * Generate or extract correlation ID from headers
   */
  initializeCorrelationId(headers: Record<string, string | undefined>): string {
    const correlationId = getOrCreateCorrelationId(headers);
    this.setCorrelationId(correlationId);
    return correlationId;
  }
}
