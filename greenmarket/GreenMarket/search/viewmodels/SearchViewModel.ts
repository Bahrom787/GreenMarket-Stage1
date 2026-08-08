import type { ProductId, SellerId } from "../../contracts/Action";
import type { AvailableAction } from "../../contracts/ContentBlock";
import type { PriceVm } from "../../presentation/PriceVm";
import type { ViewState } from "../../contracts/ViewState";

/** Один найденный товар — минимальная доменная запись для строки результата.
 *  Не ContentBlock/RowItem (это уровень разметки) — просто данные. */
export interface SearchResultItem {
  productId: ProductId;
  sellerId: SellerId;
  name: string;
  price: PriceVm;
  sellerName: string;
}

/** Доменный контракт экрана «Поиск» (ТЗ-035 §5) — то, что реально отдаёт
 *  Backend/Platform Core. Ничего не знает про рендеринг.
 *
 *  state теперь использует общий contracts/ViewState.ts (Idle/Loading/
 *  Success/Empty/Error) вместо локального типа — по архитектурному решению:
 *  различие "ещё не искали" / "искали, но пусто" действительно нужно не
 *  только этому экрану (Catalog/Favorites/Orders/History). */
export interface SearchViewModel {
  query: string;
  results: SearchResultItem[];
  resultCount: number;
  activeFilters: string[];
  state: ViewState;
  availableActions: AvailableAction[];
}
