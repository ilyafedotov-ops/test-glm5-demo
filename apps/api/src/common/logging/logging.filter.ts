import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from './logger.service';

/**
 * Interface for error response
 */
interface ErrorResponse {
  statusCode: number;
  message: string;
  error: string;
  correlationId?: string;
  timestamp: string;
  path: string;
  details?: unknown;
}

/**
 * Global exception filter that logs all errors
 */
@Catch()
@Injectable()
export class LoggingExceptionFilter implements ExceptionFilter {
  constructor() {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const logger = LoggerService.getInstance();
    
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const timestamp = new Date().toISOString();

    // Determine status code and message
    let statusCode: number;
    let message: string;
    let errorName: string;
    let errorDetails: unknown;

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      
      if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message = (responseObj['message'] as string) || exception.message;
        errorName = (responseObj['error'] as string) || exception.name;
        errorDetails = responseObj['details'];
      } else {
        message = exception.message;
        errorName = exception.name;
      }
    } else if (exception instanceof Error) {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = exception.message;
      errorName = exception.name;
    } else {
      statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorName = 'UnknownError';
    }

    // Build error response
    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error: errorName,
      timestamp,
      path: url,
    };

    // Add correlation ID if available
    const correlationId = request.headers['x-correlation-id'] as string;
    if (correlationId) {
      errorResponse.correlationId = correlationId;
    }

    // Add validation details if available
    if (errorDetails) {
      errorResponse.details = errorDetails;
    }

    // Log the error
    const logContext = {
      http: {
        method,
        url,
        statusCode,
        ip,
        userAgent,
        correlationId,
      },
      error: {
        name: errorName,
        message,
        details: errorDetails,
      },
    };

    // Use appropriate log level based on status code
    if (statusCode >= 500) {
      logger.getNexusLogger().error(
        `Exception: ${method} ${url} ${statusCode} - ${message}`,
        exception instanceof Error ? exception : new Error(String(exception)),
        logContext
      );
    } else if (statusCode >= 400) {
      logger.getNexusLogger().warn(
        `Client Error: ${method} ${url} ${statusCode} - ${message}`,
        logContext
      );
    }

    // Send error response
    // Don't expose internal errors in production
    if (statusCode >= 500 && process.env['NODE_ENV'] === 'production') {
      errorResponse.message = 'Internal server error';
      delete errorResponse.details;
    }

    response.status(statusCode).json(errorResponse);
  }
}
