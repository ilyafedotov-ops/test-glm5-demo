// Core logger
export { Logger, createLogger } from './logger';

// Types
export type {
  LogLevel,
  Environment,
  HttpContext,
  ErrorInfo,
  UserContext,
  BrowserContext,
  LoggerConfig,
  LogEntry,
  LoggerService,
  ChildLoggerOptions,
} from './types';

// Formatters
export {
  serializeError,
  serializeHttpContext,
  serializeUserContext,
  serializeBrowserContext,
  formatDuration,
  safeStringify,
} from './formatters';

// Correlation ID utilities
export {
  generateCorrelationId,
  getOrCreateCorrelationId,
  generateTraceId,
  generateSpanId,
  CorrelationContext,
} from './middleware/correlation-id';

// Context utilities
export {
  contextStore,
  createLogContext,
  enrichWithContext,
  type LogContext,
} from './middleware/context';

// Console transport
export { ConsoleTransport, type ConsoleTransportOptions } from './transports/console';
