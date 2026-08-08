import type { ContentBlock, RowItem } from "../../contracts/ContentBlock";
import type { CatalogViewModel, CatalogProductRecord, CategoryRecord } from "../viewmodels/CatalogViewModel";
import { PriceFormatter } from "../../formatting/PriceFormatter";
import { RatingFormatter } from "../../formatting/RatingFormatter";

/** CatalogViewModel → CatalogAdapter → ContentBlock[] → BottomSheetRenderer.
 *  Только преобразование модели и локальное форматирование через общие
 *  Formatter'ы. Не фильтрует, не сортирует, не вычисляет цены, не изменяет
 *  ViewModel, не обращается к Runtime.
 *
 *  SELECT_CATEGORY и REFRESH_CATALOG теперь есть в общем Action Catalog —
 *  категории кликабельны по-настоящему (CategoryTabsBlock как "list"), а
 *  ошибка загрузки использует настоящий errorRetry с рабочим действием. */
const VIRTUALIZE_THRESHOLD = 8;

function productRow(item: CatalogProductRecord, sellerId: CatalogViewModel["sellerId"]): RowItem {
  return {
    id: item.productId,
    avatar: item.photo ? "🖼" : "🥕",
    title: item.name,
    subtitle: `${item.unit} · ${RatingFormatter.format(item.rating)}`,
    trailing: PriceFormatter.format(item.price),
    tag: item.availability === "missing" ? "missing" : item.availability === "replacement" ? "replacement" : undefined,
    action: { type: "OPEN_PRODUCT", payload: { sellerId, productId: item.productId } },
  };
}

function categoryRow(category: CategoryRecord, sellerId: CatalogViewModel["sellerId"]): RowItem {
  return {
    id: category.categoryId,
    avatar: category.isSelected ? "✅" : "📂",
    title: category.name,
    subtitle: `${category.productCount} товаров`,
    action: { type: "SELECT_CATEGORY", payload: { sellerId, categoryId: category.categoryId } },
  };
}

export const CatalogAdapter = {
  toBlocks(vm: CatalogViewModel): ContentBlock[] {
    if (vm.state === "idle" || vm.state === "loading") {
      return [{ type: "skeleton" }];
    }
    if (vm.state === "error") {
      return [{ type: "errorRetry", text: "Не удалось загрузить каталог.", retryAction: { type: "REFRESH_CATALOG", payload: { sellerId: vm.sellerId } } }];
    }

    const blocks: ContentBlock[] = [];

    blocks.push({ type: "sectionLabel", text: vm.catalogTitle });

    if (vm.categories.length) {
      blocks.push({ type: "list", items: vm.categories.map((c) => categoryRow(c, vm.sellerId)) });
    }

    if (vm.state === "empty" || vm.productList.length === 0) {
      blocks.push({ type: "empty", text: "В этой категории нет товаров" });
      return blocks;
    }

    blocks.push({ type: "sectionLabel", text: `Товаров: ${vm.totalProducts}` });
    blocks.push({
      type: "list",
      items: vm.productList.map((p) => productRow(p, vm.sellerId)),
      virtualize: vm.productList.length > VIRTUALIZE_THRESHOLD,
    });

    return blocks;
  },
};
