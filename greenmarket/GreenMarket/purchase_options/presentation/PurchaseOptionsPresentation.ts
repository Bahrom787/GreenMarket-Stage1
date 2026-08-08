import type { PurchaseSummary, SellerContribution } from "../viewmodels/PurchaseOptionsViewModel";

/** Presentation-слой экрана «Варианты покупки»: превращает доменные записи
 *  (PurchaseSummary/SellerContribution) в структурированные VM для UI.
 *  Никаких строк, символов или локали — только числа/структура. Итоговое
 *  форматирование (валюта, разделители, локализованный текст) — в
 *  ../formatting, который могут переиспользовать другие экраны. */

export interface PriceVm {
  amount: number;
  currency: string;
}

export interface RatingVm {
  value: number;
  scale: number;
}

export interface SubtitleParts {
  sellersCount: number;
  missingCount: number;
}

export function toOptionPriceVm(summary: PurchaseSummary): PriceVm {
  return { amount: summary.totalCost, currency: "RUB" };
}

export function toOptionSubtitleParts(summary: PurchaseSummary): SubtitleParts {
  return { sellersCount: summary.sellersCount, missingCount: summary.missingCount };
}

export function toSellerRatingVm(seller: SellerContribution): RatingVm {
  return { value: seller.rating, scale: 5 };
}
