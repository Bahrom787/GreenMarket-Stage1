import { describe, expect, it } from 'vitest';
import {
  catalogPath,
  globalCatalogContext,
  productPath,
  storeCatalogContext,
  storeHomePath,
} from '../catalogContext';

describe('catalog context routing', () => {
  it('builds canonical Global Context routes', () => {
    expect(catalogPath(globalCatalogContext)).toBe('/');
    expect(catalogPath(globalCatalogContext, '?search=milk')).toBe('/?search=milk');
    expect(productPath(globalCatalogContext, 42)).toBe('/product/42');
    expect(productPath(globalCatalogContext, 42, '?search=milk')).toBe('/product/42?search=milk');
  });

  it('keeps Store Context in catalog and product routes', () => {
    const context = storeCatalogContext('seller-1');

    expect(storeHomePath(context.storeId)).toBe('/store/seller-1');
    expect(catalogPath(context)).toBe('/store/seller-1/catalog');
    expect(catalogPath(context, '?search=milk')).toBe('/store/seller-1/catalog?search=milk');
    expect(productPath(context, 42)).toBe('/store/seller-1/product/42');
    expect(productPath(context, 42, '?search=milk')).toBe('/store/seller-1/product/42?search=milk');
  });
});
