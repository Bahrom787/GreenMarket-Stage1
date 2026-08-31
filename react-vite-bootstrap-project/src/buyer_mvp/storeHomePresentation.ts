import type { SellerCardResponse } from './types';
import { getStorePublicIdentity, type StorePublicIdentity } from './publicStoreIdentity';

export interface StoreHomeViewModel {
  sellerId: string;
  title: string;
  description?: string;
  market?: string;
  place?: string;
  workingHours?: string;
  publicIdentity?: StorePublicIdentity;
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

  const publicIdentity = getStorePublicIdentity(seller);

  return {
    sellerId: String(seller.seller_id),
    title: seller.name,
    description: value(seller.short_description),
    market: market || undefined,
    place: place || undefined,
    workingHours: value(seller.working_hours),
    ...(publicIdentity ? { publicIdentity } : {}),
  };
}
