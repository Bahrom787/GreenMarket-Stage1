import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  canonicalAnalyticsPath,
  screenFromPath,
  trackPageView,
} from '@/shared/analytics/AnalyticsReporter';

export function AnalyticsRouteSync() {
  const location = useLocation();
  const lastPathRef = useRef<string | null>(null);

  useEffect(() => {
    const screen = screenFromPath(location.pathname);
    const path = canonicalAnalyticsPath(location.pathname, location.search);
    if (lastPathRef.current === path) return;
    lastPathRef.current = path;
    trackPageView(screen, path);
  }, [location.pathname, location.search]);

  return null;
}
