import type { ContentBlock, RowItem } from "../../contracts/ContentBlock";
import type { BasketViewModel, BasketItem } from "../viewmodels/BasketViewModel";

/** BasketViewModel → BasketAdapter → ContentBlock[] → BottomSheetRenderer.
 *  Только преобразование модели и локальное форматирование. Не пересчитывает
 *  суммы, не объединяет товары, не сортирует, не фильтрует, не изменяет
 *  количество, не обращается к Runtime — все цифры уже готовые в модели.
 *
 *  REFRESH_BASKET теперь есть в общем Action Catalog — ошибка загрузки
 *  использует настоящий errorRetry с рабочим действием, без payload
 *  (единая "текущая" корзина). START_PURCHASE используется на уровне
 *  экрана (screens/BasketScreen.ts, availableActions), не внутри самих
 *  ContentBlock — переход к оформлению покупки является кнопкой
 *  BottomActionBar, а не элементом контента списка. */
function itemRow(item: BasketItem): RowItem {
  const priceLine = item.previousPrice !== null && item.previousPrice !== item.currentPrice
    ? `${item.subtotal} ₽ (${item.currentPrice} ₽ × ${item.quantity})`
    : `${item.subtotal} ₽`;
  return {
    id: `${item.sellerId}:${item.productId}`,
    avatar: item.photo ? "🖼" : "🥕",
    title: item.name,
    subtitle: `${item.quantity} × ${item.unit}`,
    trailing: priceLine,
    tag: item.availability === "missing" ? "missing" : item.availability === "replacement" ? "replacement" : undefined,
    action: { type: "OPEN_PRODUCT", payload: { sellerId: item.sellerId, productId: item.productId } },
  };
}

const VIRTUALIZE_THRESHOLD = 8;

export const BasketAdapter = {
  toBlocks(vm: BasketViewModel): ContentBlock[] {
    if (vm.state === "idle" || vm.state === "loading") {
      return [{ type: "skeleton" }];
    }
    if (vm.state === "error") {
      return [{ type: "errorRetry", text: "Не удалось загрузить корзину.", retryAction: { type: "REFRESH_BASKET" } }];
    }
    if (vm.state === "empty" || vm.items.length === 0) {
      return [{ type: "empty", text: "Корзина пуста" }];
    }

    const blocks: ContentBlock[] = [];

    blocks.push({ type: "list", items: vm.items.map(itemRow), virtualize: vm.items.length > VIRTUALIZE_THRESHOLD });

    blocks.push({ type: "metaLine", text: `Товаров: ${vm.totalItems} · Продавцов: ${vm.purchaseSummary.sellersCount}` });
    if (vm.purchaseSummary.missingCount > 0) {
      blocks.push({ type: "alerts", items: [`${vm.purchaseSummary.missingCount} товара нет в наличии`] });
    }

    const totalsText = vm.savings > 0 ? `Итого: ${vm.totalPrice} ₽ (экономия ${vm.savings} ₽)` : `Итого: ${vm.totalPrice} ₽`;
    blocks.push({ type: "priceLine", text: totalsText });

    return blocks;
  },
};
