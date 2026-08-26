import { describe, expect, it } from 'vitest';
import { toBuyerSellerListRow } from '../sellerListPresentation';
import type { BuyerSellerListItem } from '../types';

const seller: BuyerSellerListItem = {
  seller_id: 6,
  name: 'Dev marker',
  row: 'A',
  place: '12',
  working_hours: '10-18',
  short_description: 'Greens only',
  product_count: 12,
  market: {
    id: 1,
    name: 'Dev market',
    type: 'SHOP',
    address: 'Kazan',
    latitude: '55.7',
    longitude: '49.1',
  },
};

describe('seller list presentation', () => {
  it('maps Buyer seller data without Map-specific fields', () => {
    expect(toBuyerSellerListRow(seller)).toEqual({
      sellerId: '6',
      name: 'Dev marker',
      initials: 'DM',
      description: 'Greens only',
      market: 'Dev market, Kazan',
      place: 'Ряд A, Место 12',
      workingHours: '10-18',
    });
  });
});
