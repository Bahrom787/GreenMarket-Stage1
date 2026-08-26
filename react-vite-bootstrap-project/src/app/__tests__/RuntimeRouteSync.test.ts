import { describe, expect, it } from 'vitest';
import { asProductId, asSellerId } from '@/platform-core/contracts/Action';
import { entryFromPath, nextPathFromRuntime, pathFromEntry } from '@/app/RuntimeRouteMapping';

describe('RuntimeRouteSync route mapping', () => {
  it('uses / as the canonical Global Catalog route', () => {
    expect(entryFromPath('/')).toEqual({ screen: 'Catalog', params: {} });
    expect(pathFromEntry({ screen: 'Catalog', params: {} })).toBe('/');
  });

  it('keeps Platform Core routes synced from URL paths', () => {
    expect(entryFromPath('/catalog')).toEqual({ screen: 'Catalog', params: {} });
    expect(entryFromPath('/map')).toEqual({ screen: 'Map', params: {} });
    expect(entryFromPath('/seller-list')).toEqual({ screen: 'SellerList', params: {} });
    expect(entryFromPath('/green-board')).toEqual({ screen: 'GreenBoard', params: {} });
    expect(entryFromPath('/seller/seller-1')).toEqual({
      screen: 'SellerCard',
      params: { sellerId: asSellerId('seller-1') },
    });
    expect(entryFromPath('/store/seller-1')).toEqual({
      screen: 'StoreHome',
      params: { storeId: asSellerId('seller-1') },
    });
    expect(entryFromPath('/store/seller-1/catalog')).toEqual({
      screen: 'SellerCatalog',
      params: { sellerId: asSellerId('seller-1') },
    });
    expect(entryFromPath('/store/seller-1/product/42')).toEqual({
      screen: 'ProductCard',
      params: { sellerId: asSellerId('seller-1'), productId: asProductId('42') },
    });
  });

  it('keeps Platform Core entries synced back to URL paths', () => {
    expect(pathFromEntry({ screen: 'Catalog', params: {} })).toBe('/');
    expect(pathFromEntry({ screen: 'Map', params: {} })).toBe('/map');
    expect(pathFromEntry({ screen: 'SellerList', params: {} })).toBe('/seller-list');
    expect(pathFromEntry({ screen: 'GreenBoard', params: {} })).toBe('/green-board');
    expect(
      pathFromEntry({ screen: 'StoreHome', params: { storeId: asSellerId('seller-1') } }),
    ).toBe('/store/seller-1');
    expect(
      pathFromEntry({ screen: 'SellerCard', params: { sellerId: asSellerId('seller-1') } }),
    ).toBe('/seller/seller-1');
    expect(
      pathFromEntry({ screen: 'SellerCatalog', params: { sellerId: asSellerId('seller-1') } }),
    ).toBe('/store/seller-1/catalog');
    expect(
      pathFromEntry({
        screen: 'ProductCard',
        params: { sellerId: asSellerId('seller-1'), productId: asProductId('42') },
      }),
    ).toBe('/store/seller-1/product/42');
  });

  it('normalizes the legacy /catalog alias back to the canonical / route', () => {
    const catalogEntry = { screen: 'Catalog' as const, params: {} };

    expect(entryFromPath('/')).toEqual(catalogEntry);
    expect(entryFromPath('/catalog')).toEqual(catalogEntry);

    expect(nextPathFromRuntime('/', catalogEntry)).toBeNull();
    expect(nextPathFromRuntime('/catalog', catalogEntry)).toBe('/');
    expect(nextPathFromRuntime('/map', catalogEntry)).toBe('/');
  });

  it('does not overwrite React-owned Global Product Detail routes', () => {
    const catalogEntry = { screen: 'Catalog' as const, params: {} };

    expect(entryFromPath('/product/42')).toBeNull();
    expect(nextPathFromRuntime('/product/42', catalogEntry)).toBeNull();
    expect(nextPathFromRuntime('/product/42', { screen: 'Map', params: {} })).toBe('/map');
  });
});
