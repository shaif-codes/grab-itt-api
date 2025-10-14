import { Request, Response } from 'express';

// Log levels
export const LOG_LEVELS = {
  ERROR: 'error',
  WARN: 'warn',
  INFO: 'info',
  DEBUG: 'debug'
} as const;

export type LogLevel = typeof LOG_LEVELS[keyof typeof LOG_LEVELS];

// Log entry interface
export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  requestId?: string;
  userId?: string;
  method?: string;
  url?: string;
  statusCode?: number;
  duration?: number;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
  metadata?: Record<string, any>;
}

// Logger class
export class Logger {
  private static instance: Logger;
  private isDevelopment = process.env.NODE_ENV === 'development';

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatLog(entry: LogEntry): string {
    const { level, message, timestamp, requestId, userId, method, url, statusCode, duration, error, metadata } = entry;
    
    let logString = `[${timestamp}] ${level.toUpperCase()}: ${message}`;
    
    if (requestId) logString += ` | RequestId: ${requestId}`;
    if (userId) logString += ` | UserId: ${userId}`;
    if (method && url) logString += ` | ${method} ${url}`;
    if (statusCode) logString += ` | Status: ${statusCode}`;
    if (duration) logString += ` | Duration: ${duration}ms`;
    
    if (error) {
      logString += ` | Error: ${error.name}: ${error.message}`;
      if (this.isDevelopment && error.stack) {
        logString += `\nStack: ${error.stack}`;
      }
    }
    
    if (metadata && Object.keys(metadata).length > 0) {
      logString += ` | Metadata: ${JSON.stringify(metadata)}`;
    }
    
    return logString;
  }

  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date().toISOString(),
      metadata
    };

    const formattedLog = this.formatLog(entry);
    
    // In production, you might want to send logs to a service like Winston, Pino, or CloudWatch
    switch (level) {
      case LOG_LEVELS.ERROR:
        console.error(formattedLog);
        break;
      case LOG_LEVELS.WARN:
        console.warn(formattedLog);
        break;
      case LOG_LEVELS.INFO:
        console.info(formattedLog);
        break;
      case LOG_LEVELS.DEBUG:
        if (this.isDevelopment) {
          console.debug(formattedLog);
        }
        break;
    }
  }

  error(message: string, error?: Error, metadata?: Record<string, any>): void {
    this.log(LOG_LEVELS.ERROR, message, {
      ...metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined
    });
  }

  warn(message: string, metadata?: Record<string, any>): void {
    this.log(LOG_LEVELS.WARN, message, metadata);
  }

  info(message: string, metadata?: Record<string, any>): void {
    this.log(LOG_LEVELS.INFO, message, metadata);
  }

  debug(message: string, metadata?: Record<string, any>): void {
    this.log(LOG_LEVELS.DEBUG, message, metadata);
  }

  // Request logging methods
  logRequest(req: Request, requestId: string): void {
    this.info('Incoming request', {
      requestId,
      method: req.method,
      url: req.url,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: (req as any).user?.id
    });
  }

  logResponse(req: Request, res: Response, requestId: string, duration: number): void {
    const level = res.statusCode >= 400 ? LOG_LEVELS.ERROR : LOG_LEVELS.INFO;
    this.log(level, 'Request completed', {
      requestId,
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration,
      userId: (req as any).user?.id
    });
  }

  logError(req: Request, error: Error, requestId: string): void {
    this.error('Request failed', error, {
      requestId,
      method: req.method,
      url: req.url,
      userId: (req as any).user?.id
    });
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
