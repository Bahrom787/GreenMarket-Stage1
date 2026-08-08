import type { ScreenDefinition } from "./ScreenDefinition";
import type { ProductCardViewModel } from "../product_card/viewmodels/ProductCardViewModel";
import { ProductCardBuilder } from "../product_card/builders/ProductCardBuilder";

export const ProductCardScreen: ScreenDefinition<ProductCardViewModel> = {
  builder: ProductCardBuilder,
  availableActions: ["OPEN_SELLER", "ADD_TO_BASKET", "REMOVE_FROM_BASKET", "SHOW_ON_MAP", "CHANGE_QUANTITY", "CLOSE_SCREEN", "GO_TO_MAIN"] as const,
};
