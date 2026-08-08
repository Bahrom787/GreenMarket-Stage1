import { BasketScreen as BasketScreenDefinition } from "../screens/BasketScreen";
import type { BasketViewModel } from "./viewmodels/BasketViewModel";
import type { ContentBlock } from "../contracts/ContentBlock";

/** Единственный путь сборки контента экрана «Корзина»:
 *  ScreenDefinition → ScreenBuilder → ContentBlock[]. По образцу уже
 *  принятых product_card/ProductCardScreen.tsx, search/SearchScreen.tsx,
 *  catalog/CatalogScreen.tsx — никаких преобразований, только делегирование
 *  в BasketBuilder. */
export function renderBasketBlocks(viewModel: BasketViewModel): ContentBlock[] {
  return BasketScreenDefinition.builder.build(viewModel);
}
