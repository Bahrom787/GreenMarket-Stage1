import type { ScreenDefinition } from "./ScreenDefinition";
import type { FavoritesViewModel } from "../favorites/viewmodels/FavoritesViewModel";
import { FavoritesBuilder } from "../favorites/builders/FavoritesBuilder";

/** Определение экрана «Избранное» — по аналогии с BasketScreen.ts и
 *  остальными. ScreenDefinition — только в общей screens/, не в локальной
 *  favorites/screens/ (та же схема, что уже трижды отклонялась). */
export const FavoritesScreen: ScreenDefinition<FavoritesViewModel> = {
  builder: FavoritesBuilder,
  availableActions: ["OPEN_PRODUCT", "OPEN_SELLER", "ADD_TO_BASKET", "REMOVE_FROM_FAVORITES", "REFRESH_FAVORITES", "CLOSE_SCREEN"] as const,
};
