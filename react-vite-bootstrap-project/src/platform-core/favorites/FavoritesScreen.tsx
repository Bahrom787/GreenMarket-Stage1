import { FavoritesScreen as FavoritesScreenDefinition } from "../screens/FavoritesScreen";
import type { FavoritesViewModel } from "./viewmodels/FavoritesViewModel";
import type { ContentBlock } from "../contracts/ContentBlock";

/** Единственный путь сборки контента экрана «Избранное»:
 *  ScreenDefinition → ScreenBuilder → ContentBlock[]. */
export function renderFavoritesBlocks(viewModel: FavoritesViewModel): ContentBlock[] {
  return FavoritesScreenDefinition.builder.build(viewModel);
}
