import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from '../logging/logger.service';
import { getOrCreateCorrelationId, generateTraceId, generateSpanId } from '@nexusops/logging';

/**
 * Middleware that adds correlation IDs to all requests
 */
@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  constructor() {}

  use(req: Request, res: Response, next: NextFunction): void {
    const logger = LoggerService.getInstance();
    const headers = req.headers as Record<string, string | undefined>;

    // Generate or extract correlation ID
    const correlationId = getOrCreateCorrelationId(headers);
    
    // Generate trace and span IDs for distributed tracing
    const traceId = headers['x-trace-id'] || generateTraceId();
    const spanId = generateSpanId();

    // Add IDs to request for use in controllers
    req['correlationId'] = correlationId;
    req['traceId'] = traceId;
    req['spanId'] = spanId;

    // Set IDs in logger context
    logger.setCorrelationId(correlationId);
    logger.addMetadata({
      traceId,
      spanId,
    });

    // Add correlation ID to response headers
    res.setHeader('x-correlation-id', correlationId);
    res.setHeader('x-trace-id', traceId);

    // Log request start
    logger.getNexusLogger().debug(`Request started: ${req.method} ${req.originalUrl}`, {
      correlationId,
      traceId,
      spanId,
    });

    next();
  }
}

/**
 * Type augmentation for Express Request
 */
declare module 'express' {
  interface Request {
    correlationId?: string;
    traceId?: string;
    spanId?: string;
  }
}
