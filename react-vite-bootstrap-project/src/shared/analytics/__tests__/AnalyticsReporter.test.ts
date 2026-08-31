import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  canonicalAnalyticsPath,
  configureAnalytics,
  resetAnalyticsForTests,
  sanitizeAnalyticsPayload,
  screenFromPath,
  trackEvent,
  trackPageView,
} from '../AnalyticsReporter';

afterEach(() => resetAnalyticsForTests());

describe('AnalyticsReporter', () => {
  it('is disabled when no adapter is configured', () => {
    expect(() => trackEvent('catalog_search', { screen: 'GlobalCatalog' })).not.toThrow();
    expect(() => trackPageView('GlobalCatalog', '/')).not.toThrow();
  });

  it('maps canonical routes to approved screen ids', () => {
    expect(screenFromPath('/')).toBe('GlobalCatalog');
    expect(screenFromPath('/map')).toBe('Map');
    expect(screenFromPath('/seller-list')).toBe('SellerList');
    expect(screenFromPath('/green-board')).toBe('GreenBoard');
    expect(screenFromPath('/store/6')).toBe('StoreHome');
    expect(screenFromPath('/store/6/catalog')).toBe('StoreCatalog');
    expect(screenFromPath('/product/169')).toBe('GlobalProductDetail');
    expect(screenFromPath('/store/6/product/169')).toBe('StoreProductDetail');
  });

  it('sends page views through the configured adapter', () => {
    const adapter = { trackPageView: vi.fn(), trackEvent: vi.fn() };
    configureAnalytics(adapter);

    trackPageView('SellerList', '/seller-list?seller_id=6,7');

    expect(adapter.trackPageView).toHaveBeenCalledWith('SellerList', '/seller-list?seller_id=6,7', {});
  });

  it('keeps only safe URL params for analytics paths', () => {
    expect(canonicalAnalyticsPath('/', '?search=milk&group_id=17,18&seller_id=6&page=2&sort=price')).toBe(
      '/?page=2&sort=price&group_id=17%2C18&seller_id=6',
    );
  });

  it('strips PII and arbitrary user text from event payloads', () => {
    expect(
      sanitizeAnalyticsPayload({
        seller_id: 6,
        product_id: 169,
        search_query: 'milk',
        phone: '+123',
        address: 'Main street',
        auth_token: 'secret',
      }),
    ).toEqual({ seller_id: 6, product_id: 169 });
  });
});
