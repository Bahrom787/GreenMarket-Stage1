import type { PriceVm, RatingVm, SubtitleParts } from "../presentation/PurchaseOptionsPresentation";

/** Универсальный форматирующий слой: единственное место, которое знает про
 *  локаль, символы и разделители (⭐, ·, ₽ и т.п.). Presentation отдаёт сюда
 *  только структурированные VM (PriceVm/RatingVm/SubtitleParts) — смена
 *  языка или валюты правится только здесь, Adapter и Presentation не трогаем. */

export function formatPrice(vm: PriceVm, locale = "ru-RU"): string {
  return new Intl.NumberFormat(locale, { style: "currency", currency: vm.currency, maximumFractionDigits: 0 }).format(vm.amount);
}

export function formatRating(vm: RatingVm, locale = "ru-RU"): string {
  return `★ ${vm.value.toLocaleString(locale)}`;
}

export function formatOptionSubtitle(parts: SubtitleParts): string {
  const sellersLabel = `${parts.sellersCount} продавца`;
  const missingLabel = parts.missingCount ? `${parts.missingCount} товара нет в наличии` : "всё в наличии";
  return [sellersLabel, missingLabel].join(" · ");
}

export function formatSellerSubtitle(rating: RatingVm, distance: string, locale = "ru-RU"): string {
  return [formatRating(rating, locale), distance].join(" · ");
}
