import { CatalogScreen as CatalogScreenDefinition } from "../screens/CatalogScreen";
import type { CatalogViewModel } from "./viewmodels/CatalogViewModel";
import type { ContentBlock } from "../contracts/ContentBlock";

/** Единственный путь сборки контента экрана «Каталог»:
 *  ScreenDefinition → ScreenBuilder → ContentBlock[]. По образцу уже
 *  принятых product_card/ProductCardScreen.tsx и search/SearchScreen.tsx —
 *  никаких преобразований, никакой отдельной сборки header/toolbar/
 *  availableActions, только делегирование в CatalogBuilder. */
export function renderCatalogBlocks(viewModel: CatalogViewModel): ContentBlock[] {
  return CatalogScreenDefinition.builder.build(viewModel);
}
