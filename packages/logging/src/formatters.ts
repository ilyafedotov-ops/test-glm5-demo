import type { ErrorInfo, HttpContext, UserContext, BrowserContext } from './types';

/**
 * Error serializer that safely extracts error information
 */
export function serializeError(error: unknown): ErrorInfo | undefined {
  if (!error) return undefined;

  if (error instanceof Error) {
    const errorInfo: ErrorInfo = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };

    // Handle specific error types
    if ('code' in error) {
      errorInfo.code = (error as NodeJS.ErrnoException).code;
    }

    const errorRecord = error as unknown as Record<string, unknown>;
    
    if ('details' in error && typeof errorRecord['details'] === 'object') {
      errorInfo.details = errorRecord['details'] as Record<string, unknown>;
    }

    // Handle Prisma errors
    if ('meta' in error && typeof errorRecord['meta'] === 'object') {
      errorInfo.details = {
        ...errorInfo.details,
        meta: errorRecord['meta'],
      };
    }

    return errorInfo;
  }

  // Handle non-Error throws
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error,
    };
  }

  return {
    name: 'UnknownError',
    message: JSON.stringify(error),
  };
}

/**
 * HTTP context serializer that redacts sensitive headers
 */
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'cookie',
  'set-cookie',
  'x-api-key',
  'x-auth-token',
  'x-session-id',
]);

export function serializeHttpContext(
  method: string,
  url: string,
  options: Partial<HttpContext> = {}
): HttpContext {
  const httpContext: HttpContext = {
    method,
    url: sanitizeUrl(url),
    ...options,
  };

  // Redact sensitive headers
  if (httpContext.headers) {
    httpContext.headers = Object.fromEntries(
      Object.entries(httpContext.headers).map(([key, value]) => [
        key,
        SENSITIVE_HEADERS.has(key.toLowerCase()) ? '[REDACTED]' : value,
      ])
    );
  }

  // Sanitize URL to remove sensitive query params
  if (httpContext.queryParams) {
    httpContext.queryParams = Object.fromEntries(
      Object.entries(httpContext.queryParams).map(([key, value]) => [
        key,
        SENSITIVE_HEADERS.has(key.toLowerCase()) ? '[REDACTED]' : value,
      ])
    );
  }

  return httpContext;
}

/**
 * Sanitize URL by removing sensitive query parameters
 */
function sanitizeUrl(url: string): string {
  try {
    const parsed = new URL(url, 'http://localhost');
    const sensitiveParams = ['token', 'api_key', 'apiKey', 'secret', 'password', 'auth'];
    
    sensitiveParams.forEach(param => {
      if (parsed.searchParams.has(param)) {
        parsed.searchParams.set(param, '[REDACTED]');
      }
    });
    
    return parsed.pathname + parsed.search;
  } catch {
    return url;
  }
}

/**
 * User context serializer
 */
export function serializeUserContext(user: Partial<UserContext>): UserContext | undefined {
  if (!user || !user.id) return undefined;

  return {
    id: user.id,
    email: user.email,
    organizationId: user.organizationId,
    roles: user.roles,
  };
}

/**
 * Browser context serializer
 */
export function serializeBrowserContext(
  url: string,
  userAgent: string,
  options: Partial<BrowserContext> = {}
): BrowserContext {
  return {
    url,
    userAgent,
    ...options,
  };
}

/**
 * Format duration in milliseconds
 */
export function formatDuration(startTime: number): number {
  return Date.now() - startTime;
}

/**
 * Create a safe JSON stringifier that handles circular references
 */
export function safeStringify(obj: unknown): string {
  const seen = new WeakSet();
  
  return JSON.stringify(obj, (_key, value) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  });
}
