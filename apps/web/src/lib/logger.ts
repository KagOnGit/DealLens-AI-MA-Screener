/**
 * Logger utility for telemetry and debugging
 * No-ops by default in production, can be extended with Sentry or other providers
 */

export interface LogEvent {
  event: string;
  [key: string]: unknown;
}

interface ApiStatusChangeEvent extends LogEvent {
  event: 'api_status_change';
  from: 'ok' | 'degraded' | 'down' | 'unknown';
  to: 'ok' | 'degraded' | 'down' | 'unknown';
  time: number;
  requestId?: string;
}

type TelemetryEvent = ApiStatusChangeEvent | LogEvent;

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private sentryDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;

  /**
   * Log a telemetry event
   */
  log(event: TelemetryEvent): void {
    // Always log to console in development
    if (this.isDevelopment) {
      console.info('📊 Telemetry:', event);
    }

    // Future: Add Sentry integration
    if (this.sentryDsn) {
      // TODO: Send to Sentry when NEXT_PUBLIC_SENTRY_DSN is configured
      // Sentry.addBreadcrumb({ message: event.event, data: event });
    }
  }

  /**
   * Log API status changes
   */
  apiStatusChange(
    from: ApiStatusChangeEvent['from'],
    to: ApiStatusChangeEvent['to'],
    requestId?: string
  ): void {
    this.log({
      event: 'api_status_change',
      from,
      to,
      time: Date.now(),
      requestId,
    });
  }

  /**
   * Log general events with arbitrary data
   */
  event(eventName: string, data?: Record<string, unknown>): void {
    this.log({
      event: eventName,
      ...data,
    });
  }

  /**
   * Log errors (always shown)
   */
  error(message: string, error?: Error | unknown, context?: Record<string, unknown>): void {
    const logData = {
      event: 'error',
      message,
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      ...context,
    };

    console.error('❌ Error:', logData);

    // Future: Send errors to Sentry
    if (this.sentryDsn && error instanceof Error) {
      // Sentry.captureException(error, { contexts: { custom: context } });
    }
  }

  /**
   * Log warnings (shown in development)
   */
  warn(message: string, context?: Record<string, unknown>): void {
    const logData = {
      event: 'warning',
      message,
      ...context,
    };

    if (this.isDevelopment) {
      console.warn('⚠️ Warning:', logData);
    }
  }

  /**
   * Debug logging (development only)
   */
  debug(message: string, data?: Record<string, unknown>): void {
    if (this.isDevelopment) {
      console.debug('🐛 Debug:', { message, ...data });
    }
  }
}

export const logger = new Logger();
