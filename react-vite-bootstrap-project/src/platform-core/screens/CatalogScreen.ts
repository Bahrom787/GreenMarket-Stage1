import type { ScreenDefinition } from "./ScreenDefinition";
import type { CatalogViewModel } from "../catalog/viewmodels/CatalogViewModel";
import { CatalogBuilder } from "../catalog/builders/CatalogBuilder";

/** Определение экрана «Каталог» — по аналогии с SellerCardScreen.ts,
 *  PurchaseOptionsScreen.ts, ProductCardScreen.ts, SearchScreen.ts.
 *
 *  ТЗ-036 §3 буквально просит catalog/screens/CatalogScreen.ts — локальную
 *  папку внутри модуля. Это ровно та схема, которую в прошлом раунде
 *  (SearchScreen) явно запретили как "два стандарта расположения
 *  ScreenDefinition — недопустимо". Положен здесь, в общей screens/, по уже
 *  принятому архитектурному решению, а не по букве §3 этого документа —
 *  ТЗ-036 в этой части отстало от актуального стандарта.
 *
 *  CHANGE_CATEGORY и REFRESH из ТЗ-036 §13 не существовали в Action Catalog
 *  дословно — по архитектурному решению добавлены под именами SELECT_CATEGORY
 *  и REFRESH_CATALOG (contracts/Action.ts), использованы именно они. */
export const CatalogScreen: ScreenDefinition<CatalogViewModel> = {
  builder: CatalogBuilder,
  availableActions: ["OPEN_PRODUCT", "OPEN_SELLER", "SELECT_CATEGORY", "REFRESH_CATALOG", "OPEN_MAP", "CLOSE_SCREEN"] as const,
};
