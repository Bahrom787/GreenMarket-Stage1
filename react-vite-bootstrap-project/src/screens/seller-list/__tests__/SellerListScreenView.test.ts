import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(
  join(process.cwd(), 'src/screens/seller-list/SellerListScreenView.tsx'),
  'utf8',
);

describe('SellerListScreenView architecture', () => {
  it('does not depend on Map runtime or MockSellerRepository', () => {
    expect(source).not.toContain('MapRuntime');
    expect(source).not.toContain('SellerMapRecord');
    expect(source).not.toContain('MockSellerRepository');
    expect(source).not.toContain('MOVE_MAP');
    expect(source).not.toContain('SELECT_SELLER');
    expect(source).not.toContain('ZOOM_ON_SELLER');
  });

  it('passes selected sellers to Global Catalog instead of opening Map', () => {
    expect(source).toContain("if (selectedSellerIds.length) next.set('seller_id', selectedSellerIds.join(','))");
    expect(source).toContain("navigate(next.toString() ? `/?${next.toString()}` : '/')");
    expect(source).toContain('toggleSeller(seller.sellerId)');
  });

  it('uses shared category, seller and state filter controls', () => {
    expect(source).toContain('@/components/search-filter/CategoryFilter');
    expect(source).toContain('@/components/search-filter/SellerFilter');
    expect(source).toContain('@/components/search-filter/StateFilter');
  });
});
