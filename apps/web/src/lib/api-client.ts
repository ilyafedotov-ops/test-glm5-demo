/**
 * API Client with Logging
 * 
 * Provides a typed API client that logs all requests and responses
 */

import { logger } from './logger';
import { getPerformanceTracker } from './performance';

// ============================================
// Types
// ============================================

interface RequestOptions extends RequestInit {
  /** Skip logging for this request */
  skipLogging?: boolean;
  /** Custom request ID for correlation */
  requestId?: string;
  /** Timeout in milliseconds */
  timeout?: number;
}

interface ApiError extends Error {
  status: number;
  statusText: string;
  body?: unknown;
}

// ============================================
// API Client
// ============================================

class ApiClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    };
  }

  /**
   * Set the base URL for all requests
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set a default header for all requests
   */
  setHeader(key: string, value: string): void {
    this.defaultHeaders[key] = value;
  }

  /**
   * Remove a default header
   */
  removeHeader(key: string): void {
    delete this.defaultHeaders[key];
  }

  /**
   * Set authorization header
   */
  setAuthToken(token: string | null): void {
    if (token) {
      this.defaultHeaders['Authorization'] = `Bearer ${token}`;
    } else {
      delete this.defaultHeaders['Authorization'];
    }
  }

  /**
   * Make a request
   */
  async request<T>(
    method: string,
    path: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipLogging = false, requestId, timeout, ...fetchOptions } = options;
    
    const url = `${this.baseUrl}${path}`;
    const correlationId = requestId || logger.getCorrelationId() || generateRequestId();
    
    // Merge headers
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(fetchOptions.headers as Record<string, string>),
      'X-Correlation-Id': correlationId,
    };

    const performance = getPerformanceTracker();
    const timingKey = `api:${method}:${path}`;

    // Log request
    if (!skipLogging) {
      logger.debug(`API Request: ${method} ${path}`, {
        method,
        path,
        correlationId,
      });
      performance.startTiming(timingKey);
    }

    try {
      // Create abort controller for timeout
      const controller = new AbortController();
      const timeoutId = timeout 
        ? setTimeout(() => controller.abort(), timeout)
        : undefined;

      const response = await fetch(url, {
        ...fetchOptions,
        method,
        headers,
        signal: controller.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      const duration = skipLogging ? 0 : performance.endTiming(timingKey);

      // Clone response for logging (can only read body once)
      const responseClone = response.clone();

      // Log response
      if (!skipLogging) {
        if (response.ok) {
          logger.debug(`API Response: ${method} ${path} ${response.status}`, {
            method,
            path,
            status: response.status,
            duration,
            correlationId,
          });
        } else {
          const errorBody = await responseClone.text().catch(() => 'Unable to read body');
          logger.warn(`API Error Response: ${method} ${path} ${response.status}`, {
            method,
            path,
            status: response.status,
            statusText: response.statusText,
            duration,
            correlationId,
            errorBody: errorBody.slice(0, 500),
          });
        }
      }

      // Handle non-OK responses
      if (!response.ok) {
        const error: ApiError = new Error(
          `API Error: ${response.status} ${response.statusText}`
        ) as ApiError;
        error.status = response.status;
        error.statusText = response.statusText;
        
        try {
          error.body = await response.json();
        } catch {
          // Response body is not JSON
        }
        
        throw error;
      }

      // Parse and return response
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        return response.json() as Promise<T>;
      }
      
      return response.text() as unknown as Promise<T>;
    } catch (error) {
      // End timing if not already done
      if (!skipLogging) {
        try {
          performance.endTiming(timingKey);
        } catch {
          // Timing may not have been started
        }
      }

      // Log error
      if (!skipLogging) {
        if ((error as Error).name === 'AbortError') {
          logger.warn(`API Timeout: ${method} ${path}`, {
            method,
            path,
            timeout,
            correlationId,
          });
        } else {
          logger.error(`API Error: ${method} ${path}`, error as Error, {
            method,
            path,
            correlationId,
          });
        }
      }

      throw error;
    }
  }

  // ============================================
  // Convenience methods
  // ============================================

  get<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, {
      ...options,
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  delete<T>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }
}

// ============================================
// Helper functions
// ============================================

function generateRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

// ============================================
// Singleton instance
// ============================================

let apiClient: ApiClient | null = null;

export function getApiClient(): ApiClient {
  if (!apiClient) {
    apiClient = new ApiClient(process.env['NEXT_PUBLIC_API_URL'] || '/api');
  }
  return apiClient;
}

export function createApiClient(baseUrl?: string): ApiClient {
  return new ApiClient(baseUrl);
}

// ============================================
// Export
// ============================================

export { ApiClient };
export type { ApiError, RequestOptions };
