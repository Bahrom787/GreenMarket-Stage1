import * as Sentry from '@sentry/react';
import { Diagnostics } from '@/platform-core/diagnostics/Diagnostics';
import {
  addBreadcrumb,
  reportException,
  screenFromPath,
  setErrorReporter,
  type TelemetryBreadcrumb,
  type TelemetryContext,
} from './ErrorReporter';

let handlersInstalled = false;

function release() {
  return (
    import.meta.env.VITE_SENTRY_RELEASE ||
    import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA ||
    import.meta.env.VITE_COMMIT_SHA ||
    'development'
  );
}

export function telemetryRelease() {
  return release();
}

export function initTelemetry() {
  installGlobalErrorHandlers();

  const dsn = import.meta.env.VITE_SENTRY_DSN;
  if (!dsn) return;

  Sentry.init({
    dsn,
    release: release(),
    environment: import.meta.env.MODE,
    beforeSend(event) {
      delete event.request?.cookies;
      delete event.request?.headers;
      return event;
    },
  });

  setErrorReporter({
    captureException(error: unknown, context?: TelemetryContext) {
      Sentry.withScope((scope) => {
        scope.setContext('greenmarket', (context ?? {}) as Record<string, unknown>);
        Sentry.captureException(error);
      });
    },
    captureMessage(message: string, context?: TelemetryContext) {
      Sentry.withScope((scope) => {
        scope.setContext('greenmarket', (context ?? {}) as Record<string, unknown>);
        Sentry.captureMessage(message);
      });
    },
    addBreadcrumb(breadcrumb: TelemetryBreadcrumb) {
      Sentry.addBreadcrumb(breadcrumb);
    },
  });

  Diagnostics.addSink((event) => {
    addBreadcrumb({
      category: 'diagnostics',
      message: event.name,
      level: 'info',
      data: event.payload,
    });
  });
}

function installGlobalErrorHandlers() {
  if (handlersInstalled || typeof window === 'undefined') return;
  handlersInstalled = true;

  window.addEventListener('error', (event) => {
    reportException(event.error ?? event.message, {
      screen: screenFromPath(),
      operation: 'unhandled_error',
      release: release(),
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    reportException(event.reason, {
      screen: screenFromPath(),
      operation: 'unhandled_rejection',
      release: release(),
    });
  });
}
