import { v4 as uuidv4 } from 'uuid';

/**
 * Correlation ID header names to check
 */
const CORRELATION_ID_HEADERS = [
  'x-correlation-id',
  'x-request-id',
  'x-trace-id',
  'correlation-id',
  'request-id',
];

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return uuidv4();
}

/**
 * Extract correlation ID from headers or generate a new one
 */
export function getOrCreateCorrelationId(
  headers: Record<string, string | undefined> = {}
): string {
  // Check for existing correlation ID in headers
  for (const header of CORRELATION_ID_HEADERS) {
    const value = headers[header] || headers[header.toLowerCase()];
    if (value && typeof value === 'string') {
      return value;
    }
  }

  // Generate new correlation ID
  return generateCorrelationId();
}

/**
 * Generate a trace ID (for distributed tracing)
 */
export function generateTraceId(): string {
  // 16-byte hex string (32 characters)
  return Buffer.from(uuidv4().replace(/-/g, ''), 'hex').toString('hex').slice(0, 32);
}

/**
 * Generate a span ID
 */
export function generateSpanId(): string {
  // 8-byte hex string (16 characters)
  return Buffer.from(uuidv4().replace(/-/g, ''), 'hex').toString('hex').slice(0, 16);
}

/**
 * Context for storing correlation IDs during request lifecycle
 */
export class CorrelationContext {
  private static storage = new Map<string, Map<string, string>>();

  /**
   * Create a new context for a request
   */
  static create(requestId: string): void {
    this.storage.set(requestId, new Map([
      ['correlationId', generateCorrelationId()],
      ['traceId', generateTraceId()],
      ['spanId', generateSpanId()],
    ]));
  }

  /**
   * Get correlation ID for a request
   */
  static get(requestId: string, key: string): string | undefined {
    return this.storage.get(requestId)?.get(key);
  }

  /**
   * Get all correlation data for a request
   */
  static getAll(requestId: string): Record<string, string> {
    const context = this.storage.get(requestId);
    if (!context) return {};
    return Object.fromEntries(context);
  }

  /**
   * Set correlation ID for a request
   */
  static set(requestId: string, key: string, value: string): void {
    const context = this.storage.get(requestId);
    if (context) {
      context.set(key, value);
    }
  }

  /**
   * Clear context for a request
   */
  static clear(requestId: string): void {
    this.storage.delete(requestId);
  }
}
