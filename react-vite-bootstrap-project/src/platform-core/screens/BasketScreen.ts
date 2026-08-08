import type { ScreenDefinition } from "./ScreenDefinition";
import type { BasketViewModel } from "../basket/viewmodels/BasketViewModel";
import { BasketBuilder } from "../basket/builders/BasketBuilder";

/** Определение экрана «Корзина» — по аналогии с SellerCardScreen.ts,
 *  PurchaseOptionsScreen.ts, ProductCardScreen.ts, SearchScreen.ts,
 *  CatalogScreen.ts.
 *
 *  ТЗ-037 §3 снова просит basket/screens/BasketScreen.ts — ту же схему,
 *  которую уже дважды отклоняли (Search, затем повторно актуально для
 *  Catalog) в пользу единого расположения в общей screens/. Положен здесь.
 *
 *  REFRESH_BASKET и START_PURCHASE добавлены в contracts/Action.ts по
 *  архитектурному решению — использованы здесь и в BasketAdapter.ts. */
export const BasketScreen: ScreenDefinition<BasketViewModel> = {
  builder: BasketBuilder,
  availableActions: ["OPEN_PRODUCT", "OPEN_SELLER", "CHANGE_QUANTITY", "REMOVE_FROM_BASKET", "REFRESH_BASKET", "START_PURCHASE", "CLOSE_SCREEN"] as const,
};
