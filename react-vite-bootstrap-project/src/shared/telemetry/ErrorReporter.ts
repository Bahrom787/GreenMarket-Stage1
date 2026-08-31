export type TelemetryErrorType = 'network' | 'http' | 'parse' | 'abort' | 'unknown';
export type TelemetryLevel = 'info' | 'warning' | 'error';

export interface TelemetryContext {
  screen?: string;
  operation?: string;
  endpoint?: string;
  method?: string;
  status?: number | null;
  durationMs?: number;
  errorType?: TelemetryErrorType;
  release?: string;
  data?: Record<string, unknown>;
}

export interface TelemetryBreadcrumb {
  category: string;
  message: string;
  level?: TelemetryLevel;
  data?: Record<string, unknown>;
}

export interface ErrorReporterAdapter {
  captureException(error: unknown, context?: TelemetryContext): void;
  captureMessage(message: string, context?: TelemetryContext): void;
  addBreadcrumb(breadcrumb: TelemetryBreadcrumb): void;
}

export interface TelemetryEvent {
  type: 'exception' | 'message' | 'breadcrumb';
  payload: unknown;
}

const SENSITIVE_KEY = /(authorization|cookie|token|password|secret|set-cookie)/i;
const allowedQueryParams = new Set(['page', 'sort', 'group_id', 'seller_id']);

let adapter: ErrorReporterAdapter = {
  captureException: () => undefined,
  captureMessage: () => undefined,
  addBreadcrumb: () => undefined,
};

export function setErrorReporter(next: ErrorReporterAdapter) {
  adapter = next;
}

export function reportException(error: unknown, context?: TelemetryContext) {
  const safe = sanitizeTelemetryData(context) as TelemetryContext | undefined;
  emitTestEvent({ type: 'exception', payload: { error: errorToPayload(error), context: safe } });
  adapter.captureException(error, safe);
}

export function reportMessage(message: string, context?: TelemetryContext) {
  const safe = sanitizeTelemetryData(context) as TelemetryContext | undefined;
  emitTestEvent({ type: 'message', payload: { message, context: safe } });
  adapter.captureMessage(message, safe);
}

export function addBreadcrumb(breadcrumb: TelemetryBreadcrumb) {
  const safe = sanitizeTelemetryData(breadcrumb) as TelemetryBreadcrumb;
  emitTestEvent({ type: 'breadcrumb', payload: safe });
  adapter.addBreadcrumb(safe);
}

export function classifyError(error: unknown, status?: number | null): TelemetryErrorType {
  if (error instanceof DOMException && error.name === 'AbortError') return 'abort';
  if (error instanceof Error && error.name === 'AbortError') return 'abort';
  if (status != null && status > 0) return 'http';
  if (error instanceof SyntaxError) return 'parse';
  if (error instanceof TypeError) return 'network';
  return 'unknown';
}

export function screenFromPath(pathname = globalThis.location?.pathname ?? '') {
  if (pathname === '/' || pathname === '/catalog') return 'GlobalCatalog';
  if (pathname === '/seller-list') return 'SellerList';
  if (pathname === '/map') return 'Map';
  if (pathname === '/green-board') return 'GreenBoard';
  if (/^\/product\/[^/]+$/.test(pathname)) return 'ProductDetail';
  if (/^\/store\/[^/]+$/.test(pathname)) return 'StoreHome';
  if (/^\/store\/[^/]+\/catalog$/.test(pathname)) return 'StoreCatalog';
  if (/^\/store\/[^/]+\/product\/[^/]+$/.test(pathname)) return 'StoreProductDetail';
  if (/^\/seller\/[^/]+$/.test(pathname)) return 'SellerCard';
  return 'Unknown';
}

export function operationFromEndpoint(endpoint: string) {
  const path = endpoint.split('?')[0];
  if (path === '/groups') return 'load_groups';
  if (path === '/products') return 'load_products';
  if (path === '/markets') return 'load_markets';
  if (/^\/markets\/[^/]+\/sellers$/.test(path)) return 'load_market_sellers';
  if (/^\/sellers\/[^/]+\/products$/.test(path)) return 'load_seller_products';
  if (/^\/sellers\/[^/]+$/.test(path)) return 'load_seller';
  if (/^\/products\/[^/]+$/.test(path)) return 'load_product';
  return 'api_request';
}

export function normalizeEndpoint(path: string) {
  const url = new URL(path, 'https://telemetry.local');
  const params = new URLSearchParams();
  for (const [key, value] of url.searchParams) {
    if (allowedQueryParams.has(key)) params.set(key, value);
  }
  const query = params.toString();
  return `${url.pathname}${query ? `?${query}` : ''}`;
}

export function sanitizeTelemetryData(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitizeTelemetryData);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, item]) => [
      key,
      SENSITIVE_KEY.test(key) ? '[Filtered]' : sanitizeTelemetryData(item),
    ]),
  );
}

function errorToPayload(error: unknown) {
  return error instanceof Error
    ? { name: error.name, message: error.message }
    : { message: String(error) };
}

function emitTestEvent(event: TelemetryEvent) {
  (globalThis as unknown as { __GM_TELEMETRY_EVENTS__?: TelemetryEvent[] }).__GM_TELEMETRY_EVENTS__?.push(event);
}
