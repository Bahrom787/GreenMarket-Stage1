import type { ScreenDefinition } from "../screens/ScreenDefinition";
import type { ScreenId } from "./NavigationStack";

import { CatalogScreen } from "../screens/CatalogScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { ProductCardScreen } from "../screens/ProductCardScreen";
import { BasketScreen } from "../screens/BasketScreen";
import { FavoritesScreen } from "../screens/FavoritesScreen";
import { PurchaseOptionsScreen } from "../screens/PurchaseOptionsScreen";
import { SellerCardScreen } from "../screens/SellerCardScreen";
import { SellerCatalogScreen } from "../screens/SellerCatalogScreen";

/** ScreenRegistry — единственная точка, где ScreenId (навигационное имя)
 *  сопоставляется конкретному ScreenDefinition (screens/*.ts). До этого
 *  файла все 8 ScreenDefinition существовали как независимые экспорты без
 *  общего индекса — Navigation/Runtime не могли обратиться к экрану по
 *  имени, только через прямой импорт конкретного модуля.
 *
 * `ScreenDefinition<unknown>` в значении карты — намеренно: реестр не
 * должен знать конкретный тип ViewModel каждого экрана (это знание нужно
 * только внутри runtime в точке использования, где тип восстанавливается
 * через ScreenId — см. runtime/GreenMarketRuntime.ts). */
export const ScreenRegistry: Readonly<Record<ScreenId, ScreenDefinition<unknown>>> = {
  Catalog: CatalogScreen as ScreenDefinition<unknown>,
  Search: SearchScreen as ScreenDefinition<unknown>,
  ProductCard: ProductCardScreen as ScreenDefinition<unknown>,
  Basket: BasketScreen as ScreenDefinition<unknown>,
  Favorites: FavoritesScreen as ScreenDefinition<unknown>,
  PurchaseOptions: PurchaseOptionsScreen as ScreenDefinition<unknown>,
  SellerCard: SellerCardScreen as ScreenDefinition<unknown>,
  SellerCatalog: SellerCatalogScreen as ScreenDefinition<unknown>,
};

export function getScreenDefinition(screen: ScreenId): ScreenDefinition<unknown> {
  return ScreenRegistry[screen];
}

/** Список Action, допустимых на экране — используется Runtime, чтобы
 *  отклонить dispatch действия, которое экран не заявил в своём
 *  ScreenDefinition (ТЗ-018: Action Catalog — публичный контракт;
 *  ScreenDefinition.availableActions — его проекция на конкретный экран). */
export function isActionAllowed(screen: ScreenId, actionType: string): boolean {
  return (ScreenRegistry[screen].availableActions as readonly string[]).includes(actionType);
}
