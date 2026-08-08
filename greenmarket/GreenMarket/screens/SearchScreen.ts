import type { ScreenDefinition } from "./ScreenDefinition";
import type { SearchViewModel } from "../search/viewmodels/SearchViewModel";
import { SearchBuilder } from "../search/builders/SearchBuilder";

/** Определение экрана «Поиск» — по аналогии с SellerCardScreen.ts,
 *  PurchaseOptionsScreen.ts, ProductCardScreen.ts. Ранее лежало в
 *  search/screens/SearchScreenDefinition.ts — своей локальной папке; по
 *  архитектурному решению перенесено сюда, локальная папка удалена. Теперь
 *  единый стандарт: все ScreenDefinition — только в общей screens/. */
export const SearchScreen: ScreenDefinition<SearchViewModel> = {
  builder: SearchBuilder,
  availableActions: ["OPEN_PRODUCT", "OPEN_SELLER", "SEARCH", "RETRY_SEARCH", "CLOSE_SCREEN"] as const,
};
