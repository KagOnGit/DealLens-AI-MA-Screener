if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // dynamic import keeps it tree-shakeable when DSN empty
  import("@sentry/nextjs").then(Sentry => {
    Sentry.init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN!,
      tracesSampleRate: 0.1,
    });
  });
}
