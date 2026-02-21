import type { LogLevel, LogEntry } from '../types';

/**
 * Console transport options
 */
export interface ConsoleTransportOptions {
  /** Whether to pretty print (for development) */
  prettyPrint?: boolean;
  /** Colorize output */
  colorize?: boolean;
}

/**
 * ANSI color codes
 */
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
} as const;

/**
 * Level colors
 */
const LEVEL_COLORS: Record<LogLevel, string> = {
  trace: COLORS['dim'],
  debug: COLORS['cyan'],
  info: COLORS['green'],
  warn: COLORS['yellow'],
  error: COLORS['red'],
  fatal: COLORS['bright'] + COLORS['red'],
};

/**
 * Format timestamp for pretty print
 */
function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toISOString().replace('T', ' ').slice(0, 23);
}

/**
 * Format a log entry for pretty printing
 */
function prettyFormat(entry: LogEntry, colorize: boolean): string {
  const parts: string[] = [];
  const color = colorize ? LEVEL_COLORS[entry.level] : '';
  const reset = colorize ? COLORS['reset'] : '';

  // Timestamp
  parts.push(`[${formatTimestamp(entry.timestamp)}]`);

  // Level
  const levelStr = entry.level.toUpperCase().padEnd(5);
  parts.push(`${color}${levelStr}${reset}`);

  // Context
  if (entry.context) {
    parts.push(`[${entry.context}]`);
  }

  // Correlation ID (shortened)
  if (entry.correlationId) {
    parts.push(`(${entry.correlationId.slice(0, 8)})`);
  }

  // Message
  parts.push(entry.message);

  // Additional fields
  const additional: Record<string, unknown> = {};
  const excludeKeys = new Set([
    'timestamp', 'level', 'context', 'correlationId', 'message',
    'service', 'version', 'environment', 'traceId', 'spanId'
  ]);

  Object.entries(entry).forEach(([key, value]) => {
    if (!excludeKeys.has(key) && value !== undefined) {
      additional[key] = value;
    }
  });

  if (Object.keys(additional).length > 0) {
    parts.push(JSON.stringify(additional, null, 0));
  }

  return parts.join(' ');
}

/**
 * Get environment variable
 */
function getEnv(key: string): string | undefined {
  return process.env[key];
}

/**
 * Console transport implementation
 */
export class ConsoleTransport {
  private prettyPrint: boolean;
  private colorize: boolean;

  constructor(options: ConsoleTransportOptions = {}) {
    this.prettyPrint = options.prettyPrint ?? getEnv('NODE_ENV') !== 'production';
    this.colorize = options.colorize ?? this.prettyPrint;
  }

  /**
   * Write log entry to console
   */
  write(entry: LogEntry): void {
    const output = this.prettyPrint
      ? prettyFormat(entry, this.colorize)
      : JSON.stringify(entry);

    switch (entry.level) {
      case 'fatal':
      case 'error':
        console.error(output);
        break;
      case 'warn':
        console.warn(output);
        break;
      case 'debug':
      case 'trace':
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }
}
