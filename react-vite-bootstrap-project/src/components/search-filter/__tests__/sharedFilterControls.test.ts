import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

function source(path: string) {
  return readFileSync(join(process.cwd(), path), 'utf8');
}

describe('shared SearchFilterBar controls', () => {
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
});
