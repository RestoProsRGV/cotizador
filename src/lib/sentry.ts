import * as Sentry from '@sentry/react';

export function initSentry() {
  if (import.meta.env.PROD) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      environment: 'production',
      integrations: [
        Sentry.browserTracingIntegration(),
      ],
      tracesSampleRate: 0.2,
      beforeSend(event) {
        // Don't send events for auth errors
        if (event.exception?.values?.[0]?.type === 'AuthError') {
          return null;
        }
        return event;
      },
    });
  }
}
