import type { SellerCardResponse } from './types';

export interface StoreHomeViewModel {
  title: string;
  description?: string;
  market?: string;
  place?: string;
  workingHours?: string;
}

function value(text?: string | null) {
  const trimmed = text?.trim();
  return trimmed || undefined;
}

export function toStoreHome(seller: SellerCardResponse): StoreHomeViewModel {
  const market = [value(seller.market?.name), value(seller.market?.address)]
    .filter(Boolean)
    .join(', ');
  const row = value(seller.row);
  const placeNumber = value(seller.place);
  const place = [row && `Ряд ${row}`, placeNumber && `Место ${placeNumber}`]
    .filter(Boolean)
    .join(', ');

  return {
    title: seller.name,
    description: value(seller.short_description),
    market: market || undefined,
    place: place || undefined,
    workingHours: value(seller.working_hours),
  };
}
