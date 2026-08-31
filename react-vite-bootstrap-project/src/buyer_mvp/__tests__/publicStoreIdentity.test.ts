import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  getPublicStoreUrl,
  getStorePublicIdentity,
  resolvePublicStoreIdentity,
} from '../publicStoreIdentity';
import type { SellerCardResponse } from '../types';

function seller(overrides: Partial<SellerCardResponse> = {}): SellerCardResponse {
  return {
    seller_id: 6,
    name: 'Dev marker',
    public_slug: null,
    public_url: null,
    market: null,
    row: null,
    place: null,
    working_hours: null,
    short_description: null,
    phone: null,
    whatsapp: null,
    ...overrides,
  };
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('publicStoreIdentity', () => {
  it('uses API public identity without exposing internal seller id', () => {
    const identity = getStorePublicIdentity(
      seller({ public_slug: 'dev-marker', public_url: 'https://dev-marker.example/' }),
    );

    expect(identity).toEqual({
      sellerId: 6,
      publicSlug: 'dev-marker',
      publicUrl: 'https://dev-marker.example/',
    });
    expect(identity?.publicSlug).not.toContain('6');
    expect(identity?.publicUrl).not.toContain('/store/6');
    expect(identity?.publicUrl).not.toContain('seller_id');
  });

  it('keeps Store A and Store B public URLs isolated', () => {
    const storeA = getPublicStoreUrl(
      seller({ seller_id: 6, public_slug: 'dev-marker', public_url: 'https://dev-marker.example/' }),
    );
    const storeB = getPublicStoreUrl(
      seller({ seller_id: 9, public_slug: 'flower-market', public_url: 'https://flower-market.example/' }),
    );

    expect(storeA).toBe('https://dev-marker.example/');
    expect(storeB).toBe('https://flower-market.example/');
    expect(storeA).not.toBe(storeB);
  });

  it('builds configured slug URLs without hardcoding a production domain', () => {
    vi.stubEnv('VITE_PUBLIC_STORE_DOMAIN', 'stores.example');

    expect(getPublicStoreUrl(seller({ public_slug: 'dev-marker' }))).toBe('https://dev-marker.stores.example/');
  });

  it('can resolve configured public URLs back to seller identity', () => {
    vi.stubEnv(
      'VITE_PUBLIC_STORE_IDENTITIES',
      JSON.stringify({
        6: { public_slug: 'dev-marker', public_url: 'https://dev-marker.example/' },
        9: { public_slug: 'flower-market', public_url: 'https://flower-market.example/' },
      }),
    );

    expect(resolvePublicStoreIdentity('https://dev-marker.example/')).toEqual({
      sellerId: 6,
      publicSlug: 'dev-marker',
      publicUrl: 'https://dev-marker.example/',
    });
    expect(resolvePublicStoreIdentity('https://flower-market.example/')).toMatchObject({ sellerId: 9 });
  });

  it('rejects technical deployment and internal route URLs as public store URLs', () => {
    expect(
      getPublicStoreUrl(
        seller({
          public_slug: 'dev-marker',
          public_url: 'https://green-market-stage1.vercel.app/store/6?seller_id=6',
        }),
      ),
    ).toBeUndefined();
  });

  it('rejects public slugs that expose seller id segments', () => {
    expect(
      getPublicStoreUrl(seller({ public_slug: 'store-6', public_url: 'https://store-6.example/' })),
    ).toBeUndefined();
  });
});
