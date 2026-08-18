import { afterEach, describe, expect, it, vi } from 'vitest';
import { fetchSellerProducts } from '../api';

describe('catalog api', () => {
  afterEach(() => vi.unstubAllGlobals());

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
