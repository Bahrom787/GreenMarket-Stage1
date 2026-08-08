import type { ScreenDefinition } from "./ScreenDefinition";
import type { CatalogViewModel } from "../catalog/viewmodels/CatalogViewModel";
import { CatalogBuilder } from "../catalog/builders/CatalogBuilder";

/** ПАТЧ (найдено при интеграции Map, IMP-003.1): navigation-runtime-layer/
 *  navigation/ScreenRegistry.ts и navigation/NavigationStack.ts ссылаются на
 *  ScreenId "SellerCatalog" (используется, например, действием
 *  SELECT_CATEGORY), но файла screens/SellerCatalogScreen.ts не было ни в
 *  одной версии присланного архива — реестр не компилировался как есть.
 *
 *  Временно переиспользует CatalogBuilder/CatalogViewModel: структурно
 *  SellerCatalog (каталог одного продавца по категории) совпадает с
 *  CatalogViewModel (sellerId + categories + selectedCategory). Это
 *  МИНИМАЛЬНАЯ заплатка, чтобы Runtime собирался и Map мог на неё
 *  переходить — не полноценная реализация экрана. Требует подтверждения
 *  у клиента при следующей сверке ТЗ (протокол ТЗ-026). */
export const SellerCatalogScreen: ScreenDefinition<CatalogViewModel> = {
  builder: CatalogBuilder,
  availableActions: ["OPEN_PRODUCT", "SELECT_CATEGORY", "REFRESH_CATALOG", "BACK", "CLOSE_SCREEN"] as const,
};
