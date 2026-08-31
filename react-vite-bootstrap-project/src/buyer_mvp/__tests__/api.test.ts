import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  CatalogApiError,
  fetchGroups,
  fetchSellers,
  fetchProducts,
  fetchSeller,
  fetchSellerProduct,
  fetchSellerProducts,
  normalizeCatalogApiBase,
} from '../api';
import type { SellerCatalogItem } from '../types';
import { setErrorReporter } from '@/shared/telemetry/ErrorReporter';

const sellerProduct: SellerCatalogItem = {
  seller_product_id: 404,
  product_id: 17,
  name: 'Аджика домашняя',
  catalog_name: 'Аджика',
  group_id: 2,
  group_name: 'Соусы',
  price: '125.00',
  unit: 'шт',
  stock: '29.000',
  description: null,
  origin_country: null,
  supply_date: null,
  photos: [],
};

function response(body: unknown) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('catalog api', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
    setErrorReporter({
      captureException: () => undefined,
      captureMessage: () => undefined,
      addBreadcrumb: () => undefined,
    });
  });

  it('accepts origin-only and scoped backend env values', () => {
    expect(normalizeCatalogApiBase('https://testapi.vnespecplanpodaz.online')).toBe(
      'https://testapi.vnespecplanpodaz.online/api/v1/catalog',
    );
    expect(normalizeCatalogApiBase('https://testapi.vnespecplanpodaz.online/')).toBe(
      'https://testapi.vnespecplanpodaz.online/api/v1/catalog',
    );
    expect(normalizeCatalogApiBase('https://testapi.vnespecplanpodaz.online/api/v1/catalog')).toBe(
      'https://testapi.vnespecplanpodaz.online/api/v1/catalog',
    );
    expect(normalizeCatalogApiBase('https://testapi.vnespecplanpodaz.online/api/v1/catalog/')).toBe(
      'https://testapi.vnespecplanpodaz.online/api/v1/catalog',
    );
  });

  it('rejects backend env values with unrelated paths', () => {
    expect(() =>
      normalizeCatalogApiBase('https://testapi.vnespecplanpodaz.online/some/path'),
    ).toThrow('VITE_API_BASE must be backend origin or /api/v1/catalog.');
  });

  it('uses the scoped seller catalog endpoint without global fallback', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(response({ products: [], page: 2, limit: 10, total: 0 }));
    vi.stubGlobal('fetch', fetch);

    await fetchSellerProducts('seller 1', {
      groupIds: [7, 8],
      search: 'milk',
      sort: 'price',
      page: 2,
      limit: 10,
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/catalog/sellers/seller%201/products?group_id=7,8&search=milk&sort=price&page=2&limit=10',
    );
  });

  it('loads groups from the existing catalog endpoint', async () => {
    const fetch = vi.fn().mockResolvedValue(response({ groups: [] }));
    vi.stubGlobal('fetch', fetch);

    await fetchGroups();

    expect(fetch).toHaveBeenCalledWith('/api/v1/catalog/groups');
  });

  it('reports API success breadcrumbs and failed request context separately', async () => {
    const telemetry = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      addBreadcrumb: vi.fn(),
    };
    setErrorReporter(telemetry);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(response({ groups: [] }))
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetch);

    await fetchGroups();
    await expect(fetchProducts()).rejects.toMatchObject({ status: 0 });

    expect(telemetry.addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({ message: 'load_groups:start' }));
    expect(telemetry.addBreadcrumb).toHaveBeenCalledWith(expect.objectContaining({ message: 'load_groups:success' }));
    expect(telemetry.captureException).toHaveBeenCalledWith(
      expect.any(TypeError),
      expect.objectContaining({ operation: 'load_products', endpoint: '/products?sort=name&page=1', errorType: 'network' }),
    );
  });

  it('reports HTTP and parse failures without duplicating successful breadcrumbs', async () => {
    const telemetry = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      addBreadcrumb: vi.fn(),
    };
    setErrorReporter(telemetry);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { code: 'SERVER_ERROR', message: 'Server error', details: [] } }), { status: 500 }))
      .mockResolvedValueOnce(new Response('not-json', { status: 200 }));
    vi.stubGlobal('fetch', fetch);

    await expect(fetchGroups()).rejects.toMatchObject({ status: 500, code: 'SERVER_ERROR' });
    await expect(fetchProducts()).rejects.toBeInstanceOf(SyntaxError);

    expect(telemetry.captureException).toHaveBeenNthCalledWith(
      1,
      expect.any(CatalogApiError),
      expect.objectContaining({ operation: 'load_groups', endpoint: '/groups', status: 500, errorType: 'http' }),
    );
    expect(telemetry.captureException).toHaveBeenNthCalledWith(
      2,
      expect.any(SyntaxError),
      expect.objectContaining({ operation: 'load_products', endpoint: '/products?sort=name&page=1', status: 200, errorType: 'parse' }),
    );
  });

  it('records AbortError as an API breadcrumb instead of an error event', async () => {
    const telemetry = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      addBreadcrumb: vi.fn(),
    };
    setErrorReporter(telemetry);
    const abort = new DOMException('cancelled', 'AbortError');
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(abort));

    await expect(fetchGroups()).rejects.toBe(abort);

    expect(telemetry.captureException).not.toHaveBeenCalled();
    expect(telemetry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({ message: 'load_groups:abort', data: expect.objectContaining({ errorType: 'abort' }) }),
    );
  });

  it('loads Seller List through Buyer market seller endpoints', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          markets: [
            {
              id: 1,
              name: 'Dev market',
              type: 'SHOP',
              address: 'Kazan',
              latitude: '55.7',
              longitude: '49.1',
              seller_count: 1,
            },
          ],
        }),
      )
      .mockResolvedValueOnce(
        response({
          sellers: [
            {
              seller_id: 6,
              name: 'Dev marker',
              row: 'A',
              place: '12',
              working_hours: '10-18',
              short_description: 'Fresh greens',
              product_count: 12,
            },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetch);

    await expect(fetchSellers()).resolves.toMatchObject({
      sellers: [{ seller_id: 6, name: 'Dev marker', market: { name: 'Dev market' } }],
    });
    expect(fetch).toHaveBeenNthCalledWith(1, '/api/v1/catalog/markets');
    expect(fetch).toHaveBeenNthCalledWith(2, '/api/v1/catalog/markets/1/sellers');
  });

  it('reports Seller List seller-stage failures with request and market diagnostics', async () => {
    const telemetry = {
      captureException: vi.fn(),
      captureMessage: vi.fn(),
      addBreadcrumb: vi.fn(),
    };
    setErrorReporter(telemetry);
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          markets: [{ id: 7, name: 'Dev market', type: 'SHOP', address: 'Kazan', latitude: '0', longitude: '0' }],
        }),
      )
      .mockRejectedValueOnce(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', fetch);

    await expect(fetchSellers()).rejects.toMatchObject({ status: 0 });

    expect(telemetry.addBreadcrumb).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'seller-list',
        message: 'seller_list:load_start',
        data: expect.objectContaining({ request_id: expect.any(Number), stage: 'markets' }),
      }),
    );
    expect(telemetry.captureException).toHaveBeenCalledWith(
      expect.any(TypeError),
      expect.objectContaining({
        operation: 'load_market_sellers',
        endpoint: '/markets/7/sellers',
        errorType: 'network',
        data: expect.objectContaining({
          request_id: expect.any(Number),
          stage: 'sellers',
          market_id: 7,
          error_name: 'TypeError',
          error_message: 'Failed to fetch',
        }),
      }),
    );
  });

  it('filters Seller List search inside the Buyer API facade', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          markets: [{ id: 1, name: 'Dev market', type: 'SHOP', address: 'Kazan', latitude: '0', longitude: '0' }],
        }),
      )
      .mockResolvedValueOnce(
        response({
          sellers: [
            { seller_id: 6, name: 'Dev marker', row: null, place: null, working_hours: null, short_description: null, product_count: 1 },
            { seller_id: 7, name: 'Fruit seller', row: null, place: null, working_hours: null, short_description: null, product_count: 1 },
          ],
        }),
      );
    vi.stubGlobal('fetch', fetch);

    await expect(fetchSellers({ search: 'fruit' })).resolves.toMatchObject({
      sellers: [{ seller_id: 7, name: 'Fruit seller' }],
    });
  });

  it('passes combined Global Catalog filters through the existing product endpoint', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(response({ products: [], page: 2, limit: 10, total: 0 }));
    vi.stubGlobal('fetch', fetch);

    await fetchProducts({ search: 'milk', groupIds: [12, 13], sellerIds: [6, 7], sort: 'price', page: 2 });

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/catalog/products?group_id=12,13&seller_id=6,7&search=milk&sort=price&page=2',
    );
  });

  it('omits group_id when no categories are selected', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(response({ products: [], page: 1, limit: 10, total: 0 }));
    vi.stubGlobal('fetch', fetch);

    await fetchProducts({ groupIds: [], sort: 'name', page: 1 });

    expect(fetch).toHaveBeenCalledWith('/api/v1/catalog/products?sort=name&page=1');
  });

  it('surfaces backend validation errors for malformed group_id requests', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          error: { code: 'VALIDATION_ERROR', message: 'Invalid group_id', details: [] },
        }),
        { status: 422, headers: { 'Content-Type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetch);

    await expect(fetchProducts({ groupIds: [17] })).rejects.toMatchObject({
      status: 422,
      code: 'VALIDATION_ERROR',
      message: 'Invalid group_id',
    });
  });

  it('loads Store Home from the seller endpoint without catalog fallback', async () => {
    const fetch = vi.fn().mockResolvedValue(
      response({
        seller_id: 6,
        name: 'Лавка зелени',
        market: null,
        row: null,
        place: null,
        working_hours: null,
        short_description: null,
        phone: null,
        whatsapp: null,
      }),
    );
    vi.stubGlobal('fetch', fetch);

    await expect(fetchSeller('seller 1')).resolves.toMatchObject({ name: 'Лавка зелени' });
    expect(fetch).toHaveBeenCalledOnce();
    expect(fetch).toHaveBeenCalledWith('/api/v1/catalog/sellers/seller%201');
  });

  it('finds Store Product Detail through seller-scoped catalog pages', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          products: [{ ...sellerProduct, product_id: 1 }],
          page: 1,
          limit: 100,
          total: 101,
        }),
      )
      .mockResolvedValueOnce(
        response({ products: [sellerProduct], page: 2, limit: 100, total: 101 }),
      );
    vi.stubGlobal('fetch', fetch);

    await expect(fetchSellerProduct('seller 1', 17)).resolves.toMatchObject({
      seller_product_id: 404,
      product_id: 17,
    });

    expect(fetch).toHaveBeenNthCalledWith(
      1,
      '/api/v1/catalog/sellers/seller%201/products?sort=name&page=1&limit=100',
    );
    expect(fetch).toHaveBeenNthCalledWith(
      2,
      '/api/v1/catalog/sellers/seller%201/products?sort=name&page=2&limit=100',
    );
  });

  it('uses seller_product_id when Store Product Detail opens from a concrete card', async () => {
    const fetch = vi.fn().mockResolvedValue(
      response({
        products: [{ ...sellerProduct, seller_product_id: 999 }, sellerProduct],
        page: 1,
        limit: 100,
        total: 2,
      }),
    );
    vi.stubGlobal('fetch', fetch);

    await expect(fetchSellerProduct('6', 17, 404)).resolves.toMatchObject({
      seller_product_id: 404,
    });
  });

  it('does not fall back to global product data when a store offer is missing', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(response({ products: [], page: 1, limit: 100, total: 0 }));
    vi.stubGlobal('fetch', fetch);

    await expect(fetchSellerProduct('6', 17)).rejects.toMatchObject({
      code: 'SELLER_PRODUCT_NOT_FOUND',
      status: 404,
    });
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/catalog/sellers/6/products?sort=name&page=1&limit=100',
    );
  });
});
