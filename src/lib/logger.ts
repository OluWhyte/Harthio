/**
 * Production-safe logging utility
 * Replaces console.log/error with structured logging
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` ${JSON.stringify(context)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  warn(message: string, context?: LogContext | unknown): void {
    const safeContext = this.ensureLogContext(context);
    console.warn(this.formatMessage('warn', message, safeContext));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext: LogContext = {
      ...context,
      error: error instanceof Error ? {
        message: error.message,
        stack: this.isDevelopment ? error.stack : undefined
      } : error
    };
    console.error(this.formatMessage('error', message, errorContext));
  }

  private ensureLogContext(value: LogContext | unknown): LogContext | undefined {
    if (!value) return undefined;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as LogContext;
    }
    return { value };
  }

  // API-specific logging
  api(endpoint: string, method: string, status: number, context?: LogContext): void {
    this.info(`API ${method} ${endpoint}`, { status, ...context });
  }

  // Security event logging
  security(event: string, context?: LogContext): void {
    this.warn(`SECURITY: ${event}`, context);
  }
}

export const logger = new Logger();
