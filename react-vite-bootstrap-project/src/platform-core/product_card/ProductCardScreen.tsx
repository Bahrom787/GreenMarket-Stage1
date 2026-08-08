import { ProductCardScreen as ProductCardScreenDefinition } from "../screens/ProductCardScreen";
import type { ProductCardViewModel } from "./viewmodels/ProductCardViewModel";
import type { ContentBlock } from "../contracts/ContentBlock";

/** Единственный путь сборки контента экрана «Карточка товара»:
 *  ScreenDefinition → ScreenBuilder → ContentBlock[].
 *
 *  Раньше здесь была функция buildProductCardViewModel(), которая вызывала
 *  ProductCardAdapter напрямую и параллельно собирала весь Bottom Sheet
 *  ViewModel (header/toolbar/availableActions) — второй, дублирующий
 *  механизм сборки экрана. Убрана по замечанию ревью. Этот файл больше не
 *  делает никаких преобразований, только принимает готовую
 *  ProductCardViewModel и делегирует уже существующему ProductCardBuilder
 *  через screens/ProductCardScreen.ts. Новый Builder не создавался —
 *  используется тот, что уже есть. */
export function renderProductCardBlocks(viewModel: ProductCardViewModel): ContentBlock[] {
  return ProductCardScreenDefinition.builder.build(viewModel);
}
