import type { UserContext, HttpContext, BrowserContext } from '../types';

/**
 * Log context that gets attached to all logs during a request
 */
export interface LogContext {
  correlationId?: string;
  traceId?: string;
  spanId?: string;
  userId?: string;
  user?: UserContext;
  http?: HttpContext;
  browser?: BrowserContext;
  metadata?: Record<string, unknown>;
}

/**
 * Async local storage for request context
 * Uses global state to maintain context across async operations
 */
class ContextStore {
  private store: Map<string, LogContext> = new Map();
  private currentContextId: string | null = null;

  /**
   * Run a function with a specific context
   */
  run<T>(contextId: string, context: LogContext, fn: () => T): T {
    const previousId = this.currentContextId;
    this.currentContextId = contextId;
    this.store.set(contextId, context);
    
    try {
      return fn();
    } finally {
      this.store.delete(contextId);
      this.currentContextId = previousId;
    }
  }

  /**
   * Get the current context
   */
  get(): LogContext | undefined {
    if (!this.currentContextId) return undefined;
    return this.store.get(this.currentContextId);
  }

  /**
   * Update the current context
   */
  update(updates: Partial<LogContext>): void {
    const context = this.get();
    if (context) {
      Object.assign(context, updates);
    }
  }

  /**
   * Set a specific value in the current context
   */
  setValue<K extends keyof LogContext>(key: K, value: LogContext[K]): void {
    const context = this.get();
    if (context) {
      context[key] = value;
    }
  }

  /**
   * Add metadata to the current context
   */
  addMetadata(metadata: Record<string, unknown>): void {
    const context = this.get();
    if (context) {
      context.metadata = { ...context.metadata, ...metadata };
    }
  }
}

// Global context store instance
export const contextStore = new ContextStore();

/**
 * Create a new log context
 */
export function createLogContext(
  correlationId?: string,
  initialContext?: Partial<LogContext>
): LogContext {
  return {
    correlationId,
    ...initialContext,
  };
}

/**
 * Enrich a log entry with context
 */
export function enrichWithContext(
  entry: Record<string, unknown>,
  context?: LogContext
): Record<string, unknown> {
  const ctx = context || contextStore.get();
  if (!ctx) return entry;

  const enriched = { ...entry };

  if (ctx['correlationId']) {
    enriched['correlationId'] = ctx['correlationId'];
  }
  if (ctx['traceId']) {
    enriched['traceId'] = ctx['traceId'];
  }
  if (ctx['spanId']) {
    enriched['spanId'] = ctx['spanId'];
  }
  if (ctx['userId']) {
    enriched['userId'] = ctx['userId'];
  }
  if (ctx['user']) {
    enriched['user'] = ctx['user'];
  }
  if (ctx['http']) {
    enriched['http'] = ctx['http'];
  }
  if (ctx['browser']) {
    enriched['browser'] = ctx['browser'];
  }
  if (ctx['metadata']) {
    const existingMetadata = enriched['metadata'] as Record<string, unknown> | undefined;
    enriched['metadata'] = { ...(existingMetadata || {}), ...ctx['metadata'] };
  }

  return enriched;
}
