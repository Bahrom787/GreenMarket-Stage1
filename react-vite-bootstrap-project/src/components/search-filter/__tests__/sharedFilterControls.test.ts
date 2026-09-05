import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { clearStoredSearchFilters, loadStoredSearchFilters, saveStoredSearchFilters } from '../filterStorage';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('shared SearchFilterBar controls', () => {
  beforeEach(() => {
    const store = new Map<string, string>();
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: {
        getItem: (key: string) => store.get(key) ?? null,
        setItem: (key: string, value: string) => store.set(key, value),
        removeItem: (key: string) => store.delete(key),
      },
    });
  });

  it('uses the same CategoryFilter on Catalog, Seller List and Map', () => {
    for (const path of [
      'src/buyer_mvp/screens/CatalogScreen.tsx',
      'src/screens/seller-list/SellerListScreenView.tsx',
      'src/screens/map/MapScreenView.tsx',
    ]) {
      expect(source(path)).toContain('@/components/search-filter/CategoryFilter');
    }
  });

  it('uses compact StateFilter pills on Catalog, Seller List and Map', () => {
    for (const path of [
      'src/buyer_mvp/screens/CatalogScreen.tsx',
      'src/screens/seller-list/SellerListScreenView.tsx',
      'src/screens/map/MapScreenView.tsx',
    ]) {
      expect(source(path)).toContain('@/components/search-filter/StateFilter');
    }
  });

  it('persists one global filter state with safe defaults', () => {
    clearStoredSearchFilters();
    expect(loadStoredSearchFilters()).toEqual({
      searchQuery: '',
      categoryIds: [],
      sellerIds: [],
      stateIds: [],
      sort: 'name',
    });

    saveStoredSearchFilters({
      searchQuery: 'milk',
      categoryIds: [17],
      sellerIds: [6],
      stateIds: ['open'],
      sort: 'price',
    });

    expect(loadStoredSearchFilters()).toEqual({
      searchQuery: 'milk',
      categoryIds: [17],
      sellerIds: [6],
      stateIds: ['open'],
      sort: 'price',
    });

    localStorage.setItem('gm.searchFilterBar.filters.v1', '{broken');
    expect(loadStoredSearchFilters().sort).toBe('name');
  });
});
