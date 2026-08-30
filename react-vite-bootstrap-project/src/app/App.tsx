import { BrowserRouter, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { ThemeProvider } from '@/design-system/ThemeProvider';
import { GreenMarketRuntimeProvider } from '@/platform-core/navigation-runtime-layer/hooks/useGreenMarketRuntime';
import { ErrorBoundary } from '@/app/ErrorBoundary';
import { NavigationContainer } from '@/app/NavigationContainer';
import { RuntimeRouteSync } from '@/app/RuntimeRouteSync';
import { Screen } from '@/layout';
import { addBreadcrumb, screenFromPath } from '@/shared/telemetry/ErrorReporter';

function NavigationTelemetry() {
  const location = useLocation();

  useEffect(() => {
    addBreadcrumb({
      category: 'navigation',
      message: 'route_changed',
      level: 'info',
      data: { screen: screenFromPath(location.pathname), path: location.pathname },
    });
  }, [location.pathname]);

  return null;
}

/**
 * App Shell: ThemeProvider -> GreenMarketRuntimeProvider (real Platform
 * Core Runtime, IMP-003) -> ErrorBoundary -> Router.
 * Screen provides the token-driven base background/layout for the whole app.
 */
export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <GreenMarketRuntimeProvider>
          <BrowserRouter>
            <NavigationTelemetry />
            <RuntimeRouteSync />
            <Screen>
              <NavigationContainer />
            </Screen>
          </BrowserRouter>
        </GreenMarketRuntimeProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
