export type AnalyticsScreenId =
  | 'GlobalCatalog'
  | 'Map'
  | 'SellerList'
  | 'GreenBoard'
  | 'StoreHome'
  | 'StoreCatalog'
  | 'GlobalProductDetail'
  | 'StoreProductDetail'
  | 'Unknown';

export type AnalyticsEventName =
  | 'catalog_search'
  | 'catalog_category_select'
  | 'catalog_product_open'
  | 'catalog_filter_use'
  | 'catalog_sort_use'
  | 'seller_list_open'
  | 'seller_select'
  | 'seller_selected'
  | 'seller_products_open'
  | 'seller_filter_applied'
  | 'seller_filter_catalog_open'
  | 'store_open'
  | 'store_catalog_open'
  | 'store_product_open'
  | 'product_open'
  | 'product_offer_store_open'
  | 'map_open'
  | 'map_marker_open'
  | 'map_mode_switch'
  | 'map_filter_use'
  | 'category_panel_open'
  | 'category_panel_collapse'
  | 'category_select'
  | 'category_view_mode_text'
  | 'category_view_mode_icon'
  | 'category_autocollapse';

export type AnalyticsPrimitive = string | number | boolean | null;
export type AnalyticsPayload = Record<string, AnalyticsPrimitive | undefined>;

export interface AnalyticsAdapter {
  trackPageView(screen: AnalyticsScreenId, path: string, payload?: AnalyticsPayload): void;
  trackEvent(name: AnalyticsEventName, payload?: AnalyticsPayload): void;
}

const safeQueryParams = new Set(['page', 'sort', 'group_id', 'seller_id']);
const sensitiveKeyParts = [
  'password',
  'token',
  'authorization',
  'cookie',
  'email',
  'phone',
  'whatsapp',
  'address',
  'message',
  'text',
  'query',
  'search',
  'name',
];

let adapter: AnalyticsAdapter | null = null;

export function configureAnalytics(nextAdapter: AnalyticsAdapter | null): void {
  adapter = nextAdapter;
}

export function resetAnalyticsForTests(): void {
  adapter = null;
}

export function sanitizeAnalyticsPayload(payload: AnalyticsPayload = {}): AnalyticsPayload {
  return Object.fromEntries(
    Object.entries(payload).filter(([key, value]) => {
      if (value === undefined) return false;
      if (typeof value === 'number' && !Number.isFinite(value)) return false;
      const normalizedKey = key.toLowerCase();
      return !sensitiveKeyParts.some((part) => normalizedKey.includes(part));
    }),
  );
}

export function trackPageView(screen: AnalyticsScreenId, path: string, payload?: AnalyticsPayload): void {
  adapter?.trackPageView(screen, path, sanitizeAnalyticsPayload(payload));
}

export function trackEvent(name: AnalyticsEventName, payload?: AnalyticsPayload): void {
  adapter?.trackEvent(name, sanitizeAnalyticsPayload(payload));
}

export function screenFromPath(pathname: string): AnalyticsScreenId {
  if (pathname === '/' || pathname === '/catalog') return 'GlobalCatalog';
  if (pathname === '/map') return 'Map';
  if (pathname === '/seller-list') return 'SellerList';
  if (pathname === '/green-board') return 'GreenBoard';
  if (/^\/store\/[^/]+\/catalog\/?$/.test(pathname)) return 'StoreCatalog';
  if (/^\/store\/[^/]+\/product\/[^/]+\/?$/.test(pathname)) return 'StoreProductDetail';
  if (/^\/store\/[^/]+\/?$/.test(pathname)) return 'StoreHome';
  if (/^\/product\/[^/]+\/?$/.test(pathname)) return 'GlobalProductDetail';
  return 'Unknown';
}

export function canonicalAnalyticsPath(pathname: string, search = ''): string {
  const params = new URLSearchParams(search);
  const safeParams = new URLSearchParams();

  for (const key of safeQueryParams) {
    const value = params.get(key);
    if (value) safeParams.set(key, value);
  }

  const query = safeParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
