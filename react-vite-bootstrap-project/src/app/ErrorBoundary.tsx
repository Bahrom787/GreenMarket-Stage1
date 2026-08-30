import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportException, screenFromPath } from '@/shared/telemetry/ErrorReporter';
import { telemetryRelease } from '@/shared/telemetry/sentryTelemetry';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    reportException(error, {
      screen: screenFromPath(),
      operation: 'react_error_boundary',
      release: telemetryRelease(),
      data: { componentStack: errorInfo.componentStack },
    });
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div role="alert" style={{ padding: 24 }}>
          <h1>Что-то пошло не так</h1>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
