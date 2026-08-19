import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSellerProducts, normalizeCatalogApiBase } from '../api';

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
    expect(() => normalizeCatalogApiBase('https://testapi.vnespecplanpodaz.online/some/path')).toThrow(
      'VITE_API_BASE must be backend origin or /api/v1/catalog.',
    );
  });

  it('uses the scoped seller catalog endpoint without global fallback', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ products: [], page: 2, limit: 10, total: 0 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);

    await fetchSellerProducts('seller 1', { groupId: 7, search: 'milk', sort: 'price', page: 2, limit: 10 });

    expect(fetch).toHaveBeenCalledWith(
      '/api/v1/catalog/sellers/seller%201/products?group_id=7&search=milk&sort=price&page=2&limit=10',
    );
  });
});
