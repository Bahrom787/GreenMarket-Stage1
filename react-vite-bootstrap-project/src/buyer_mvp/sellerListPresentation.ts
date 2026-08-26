import type { BuyerSellerListItem } from './types';

export interface BuyerSellerListRow {
  sellerId: string;
  name: string;
  initials: string;
  description?: string;
  market?: string;
  place?: string;
  workingHours?: string;
}

function clean(value?: string | null) {
  const text = value?.trim();
  return text || undefined;
}

function initialsOf(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase();
}

export function toBuyerSellerListRow(seller: BuyerSellerListItem): BuyerSellerListRow {
  const row = clean(seller.row);
  const place = clean(seller.place);

  return {
    sellerId: String(seller.seller_id),
    name: seller.name,
    initials: initialsOf(seller.name),
    description: clean(seller.short_description),
    market: [clean(seller.market.name), clean(seller.market.address)].filter(Boolean).join(', ') || undefined,
    place: [row && `Ряд ${row}`, place && `Место ${place}`].filter(Boolean).join(', ') || undefined,
    workingHours: clean(seller.working_hours),
  };
}
