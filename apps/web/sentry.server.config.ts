import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Capture 10% of the transactions for performance monitoring.
    tracesSampleRate: 0.1,
    
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Set environment
    environment: process.env.NODE_ENV || 'development',
    
    // Add user context and server info
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
        return null;
      }
      
      // Add server context
      if (!event.contexts) {
        event.contexts = {};
      }
      
      event.contexts.server = {
        name: 'Next.js Server',
        version: process.version,
      };
      
      // Mask sensitive information
      if (event.request?.headers) {
        const headers = { ...event.request.headers };
        if (headers.authorization) {
          headers.authorization = '[Filtered]';
        }
        if (headers.cookie) {
          headers.cookie = '[Filtered]';
        }
        event.request.headers = headers;
      }
      
      return event;
    },
    
    // Custom tags
    tags: {
      component: 'web-server',
    },
    
    // Initial scope
    initialScope: {
      tags: { component: 'web-server' },
      contexts: {
        app: {
          name: 'DealLens Web Server',
          version: process.env.npm_package_version || '0.1.0',
        },
      },
    },
  });
  
  console.info('🔍 Sentry initialized for web server');
} else {
  console.info('🔍 Sentry not initialized - NEXT_PUBLIC_SENTRY_DSN not provided');
}
