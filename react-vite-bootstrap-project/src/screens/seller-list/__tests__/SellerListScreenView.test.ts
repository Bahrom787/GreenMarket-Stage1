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

  it('opens Seller Card route from the list', () => {
    expect(source).toContain("navigate(`/seller/${seller.sellerId}`)");
  });
});
