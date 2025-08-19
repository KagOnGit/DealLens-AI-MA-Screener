import * as Sentry from '@sentry/nextjs';

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    
    // Capture 10% of the transactions for performance monitoring.
    tracesSampleRate: 0.1,
    
    // Capture 100% of the transactions for profiling.
    profilesSampleRate: 1.0,
    
    // Enable debug mode in development
    debug: process.env.NODE_ENV === 'development',
    
    // Set environment
    environment: process.env.NODE_ENV || 'development',
    
    // Add user context when available
    beforeSend(event, hint) {
      // Don't send events in development unless explicitly enabled
      if (process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_SENTRY_DEBUG) {
        return null;
      }
      
      // Filter out known non-critical errors
      if (event.exception) {
        const error = event.exception.values?.[0];
        if (error?.type === 'ChunkLoadError' || 
            error?.type === 'ResizeObserver loop limit exceeded' ||
            error?.value?.includes('Non-Error promise rejection captured')) {
          return null;
        }
      }
      
      return event;
    },
    
    // Configure integrations
    integrations: [
      Sentry.browserTracingIntegration({
        // Set up automatic route change tracking for Next.js App Router
        routingInstrumentation: Sentry.nextjsRouterInstrumentation({
          // Specify the App Router
        }),
      }),
      Sentry.replayIntegration({
        // Capture 10% of all sessions,
        sessionSampleRate: 0.1,
        // ...but capture 100% of sessions with an error
        errorSampleRate: 1.0,
      }),
    ],
    
    // Custom tags
    tags: {
      component: 'web',
    },
    
    // Initial scope
    initialScope: {
      tags: { component: 'web' },
      contexts: {
        app: {
          name: 'DealLens Web',
          version: process.env.npm_package_version || '0.1.0',
        },
      },
    },
  });
  
  console.info('🔍 Sentry initialized for web client');
} else {
  console.info('🔍 Sentry not initialized - NEXT_PUBLIC_SENTRY_DSN not provided');
}
