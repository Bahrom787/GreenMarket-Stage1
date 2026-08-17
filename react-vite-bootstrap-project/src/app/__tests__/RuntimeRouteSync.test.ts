import { describe, expect, it } from 'vitest';
import { asSellerId } from '@/platform-core/contracts/Action';
import { entryFromPath, pathFromEntry } from '@/app/RuntimeRouteMapping';

describe('RuntimeRouteSync route mapping', () => {
  it('does not sync the Buyer MVP home route into Platform Core Catalog', () => {
    expect(entryFromPath('/')).toBeNull();
  });

  it('keeps Platform Core routes synced from URL paths', () => {
    expect(entryFromPath('/catalog')).toEqual({ screen: 'Catalog', params: {} });
    expect(entryFromPath('/map')).toEqual({ screen: 'Map', params: {} });
    expect(entryFromPath('/seller-list')).toEqual({ screen: 'SellerList', params: {} });
    expect(entryFromPath('/seller/seller-1', 'seller-1')).toEqual({
      screen: 'SellerCard',
      params: { sellerId: asSellerId('seller-1') },
    });
  });

  it('keeps Platform Core entries synced back to URL paths', () => {
    expect(pathFromEntry({ screen: 'Catalog', params: {} })).toBe('/catalog');
    expect(pathFromEntry({ screen: 'Map', params: {} })).toBe('/map');
    expect(pathFromEntry({ screen: 'SellerList', params: {} })).toBe('/seller-list');
    expect(pathFromEntry({ screen: 'SellerCard', params: { sellerId: asSellerId('seller-1') } })).toBe(
      '/seller/seller-1',
    );
  });
});
