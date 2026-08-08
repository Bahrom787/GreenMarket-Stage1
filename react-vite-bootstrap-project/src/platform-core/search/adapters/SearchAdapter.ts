import type { ContentBlock, RowItem } from "../../contracts/ContentBlock";
import type { SearchViewModel, SearchResultItem } from "../viewmodels/SearchViewModel";
import { PriceFormatter } from "../../formatting/PriceFormatter";

/** SearchViewModel → SearchAdapter → ContentBlock[] → BottomSheetRenderer.
 *  Только преобразование модели и локальное форматирование через общие
 *  Formatter'ы (formatting/). Не выполняет поиск, не сортирует, не
 *  фильтрует, не изменяет данные Runtime.
 *
 *  SEARCH используется для обычного поиска (в availableActions экрана,
 *  screens/SearchScreen.ts — сам ввод запроса и триггер поиска находятся вне
 *  ContentBlock, это SearchFieldBlock, не смоделированный как отдельный
 *  ContentBlock-тип). RETRY_SEARCH — только для повторной попытки после
 *  ошибки, отдельно от обычного поиска, без параметра query (Runtime уже
 *  знает последний запрос). */
const VIRTUALIZE_THRESHOLD = 8;

function resultRow(item: SearchResultItem): RowItem {
  return {
    id: `${item.sellerId}:${item.productId}`,
    avatar: "🥕",
    title: item.name,
    subtitle: item.sellerName,
    trailing: PriceFormatter.format(item.price),
    action: { type: "OPEN_PRODUCT", payload: { sellerId: item.sellerId, productId: item.productId } },
  };
}

export const SearchAdapter = {
  toBlocks(vm: SearchViewModel): ContentBlock[] {
    if (vm.state === "idle") {
      return [{ type: "empty", text: "Начните вводить название товара или продавца" }];
    }
    if (vm.state === "loading") {
      return [{ type: "skeleton" }];
    }
    if (vm.state === "error") {
      return [{ type: "errorRetry", text: "Не удалось выполнить поиск.", retryAction: { type: "RETRY_SEARCH" } }];
    }

    const blocks: ContentBlock[] = [];

    if (vm.activeFilters.length) {
      blocks.push({ type: "text", text: `Фильтры: ${vm.activeFilters.join(", ")}` });
    }

    if (vm.state === "empty" || vm.results.length === 0) {
      blocks.push({ type: "empty", text: `Ничего не найдено по запросу «${vm.query}»` });
      return blocks;
    }

    blocks.push({ type: "sectionLabel", text: `Найдено: ${vm.resultCount}` });
    blocks.push({ type: "list", items: vm.results.map(resultRow), virtualize: vm.results.length > VIRTUALIZE_THRESHOLD });

    return blocks;
  },
};
