import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSeller, fetchSellerProduct, fetchSellerProducts, normalizeCatalogApiBase } from '../api';
import type { SellerCatalogItem } from '../types';

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
  afterEach(() => vi.unstubAllGlobals());

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
      groupId: 7,
      search: 'milk',
      sort: 'price',
      page: 2,
      limit: 10,
    });

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/catalog/sellers/seller%201/products?group_id=7&search=milk&sort=price&page=2&limit=10',
    );
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
