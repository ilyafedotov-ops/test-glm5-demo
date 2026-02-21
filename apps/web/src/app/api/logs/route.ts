/**
 * API Route: /api/logs
 * 
 * Receives logs from the client-side logger and forwards them
 * to the server-side logger.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createLogger, type LogLevel } from '@nexusops/logging';

// Create server-side logger
const logger = createLogger({
  service: 'nexusops-web',
  version: process.env['npm_package_version'] || '1.0.0',
  environment: process.env['NODE_ENV'] || 'development',
  level: (process.env['LOG_LEVEL'] as LogLevel) || 'info',
  prettyPrint: process.env['NODE_ENV'] !== 'production',
});

interface ClientLogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  service: string;
  version?: string;
  environment?: string;
  context?: string;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, unknown>;
  browser?: {
    url: string;
    userAgent: string;
    viewport?: { width: number; height: number };
    language?: string;
  };
  user?: {
    id: string;
    email?: string;
    organizationId?: string;
    roles?: string[];
  };
  correlationId?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ClientLogEntry = await request.json();
    
    // Validate required fields
    if (!body.level || !body.message) {
      return NextResponse.json(
        { error: 'Missing required fields: level, message' },
        { status: 400 }
      );
    }

    // Build log context
    const logContext: Record<string, unknown> = {
      source: 'client',
      browser: body.browser,
      user: body.user,
      correlationId: body.correlationId,
      context: body.context,
      ...body.metadata,
    };

    // Log using the server-side logger
    const error = body.error 
      ? Object.assign(new Error(body.error.message), {
          name: body.error.name,
          stack: body.error.stack,
        })
      : undefined;

    switch (body.level) {
      case 'trace':
        logger.trace(body.message, logContext);
        break;
      case 'debug':
        logger.debug(body.message, logContext);
        break;
      case 'info':
        logger.info(body.message, logContext);
        break;
      case 'warn':
        logger.warn(body.message, logContext);
        break;
      case 'error':
        logger.error(body.message, error, logContext);
        break;
      case 'fatal':
        logger.fatal(body.message, error, logContext);
        break;
      default:
        logger.info(body.message, logContext);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    // Log the error on the server
    logger.error('Failed to process client log', error as Error);
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Rate limiting - only accept POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}
