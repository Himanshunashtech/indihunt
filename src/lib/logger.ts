// Structured JSON Logger with Request Correlation ID support

export type LogLevel = 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  requestId?: string;
  path?: string;
  method?: string;
  durationMs?: number;
  statusCode?: number;
  details?: any;
}

class Logger {
  private formatLog(entry: LogEntry): string {
    return JSON.stringify({
      timestamp: entry.timestamp || new Date().toISOString(),
      level: entry.level,
      message: entry.message,
      ...(entry.requestId && { requestId: entry.requestId }),
      ...(entry.path && { path: entry.path }),
      ...(entry.method && { method: entry.method }),
      ...(entry.durationMs !== undefined && { durationMs: entry.durationMs }),
      ...(entry.statusCode !== undefined && { statusCode: entry.statusCode }),
      ...(entry.details && { details: entry.details }),
    });
  }

  info(message: string, context: Partial<LogEntry> = {}) {
  }

  warn(message: string, context: Partial<LogEntry> = {}) {
    console.warn(
      this.formatLog({
        timestamp: new Date().toISOString(),
        level: 'WARN',
        message,
        ...context,
      })
    );
  }

  error(message: string, context: Partial<LogEntry> = {}) {
    console.error(
      this.formatLog({
        timestamp: new Date().toISOString(),
        level: 'ERROR',
        message,
        ...context,
      })
    );
  }

  debug(message: string, context: Partial<LogEntry> = {}) {
    if (process.env.NODE_ENV !== 'production') {
    }
  }
}

export const logger = new Logger();
