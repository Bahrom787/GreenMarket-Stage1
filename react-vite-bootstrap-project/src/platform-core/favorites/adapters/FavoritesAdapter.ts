import type { ContentBlock, RowItem } from "../../contracts/ContentBlock";
import type { FavoritesViewModel, FavoriteItem } from "../viewmodels/FavoritesViewModel";
import { RatingFormatter } from "../../formatting/RatingFormatter";

/** FavoritesViewModel → FavoritesAdapter → ContentBlock[] → BottomSheetRenderer.
 *  Только преобразование модели и локальное форматирование через общие
 *  Formatter'ы. Не сортирует, не фильтрует, не изменяет список, не изменяет
 *  признак избранного, не обращается к Runtime. */
const VIRTUALIZE_THRESHOLD = 8;

function favoriteRow(item: FavoriteItem): RowItem {
  const price = item.previousPrice !== null && item.previousPrice !== item.currentPrice
    ? `${item.currentPrice} ₽ (было ${item.previousPrice} ₽)`
    : `${item.currentPrice} ₽`;
  return {
    id: `${item.sellerId}:${item.productId}`,
    avatar: item.photo ? "🖼" : "❤️",
    title: item.name,
    subtitle: `${item.unit} · ${RatingFormatter.format(item.rating)}`,
    trailing: price,
    tag: item.availability === "missing" ? "missing" : item.availability === "replacement" ? "replacement" : undefined,
    action: { type: "OPEN_PRODUCT", payload: { sellerId: item.sellerId, productId: item.productId } },
  };
}

export const FavoritesAdapter = {
  toBlocks(vm: FavoritesViewModel): ContentBlock[] {
    if (vm.state === "idle" || vm.state === "loading") {
      return [{ type: "skeleton" }];
    }
    if (vm.state === "error") {
      return [{ type: "errorRetry", text: "Не удалось загрузить избранное.", retryAction: { type: "REFRESH_FAVORITES" } }];
    }
    if (vm.state === "empty" || vm.items.length === 0) {
      return [{ type: "empty", text: "Список избранного пуст" }];
    }

    return [
      { type: "sectionLabel", text: `Избранное: ${vm.totalItems}` },
      { type: "list", items: vm.items.map(favoriteRow), virtualize: vm.items.length > VIRTUALIZE_THRESHOLD },
    ];
  },
};
