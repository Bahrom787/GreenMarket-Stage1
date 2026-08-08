import type { ScreenBuilder } from "../../builders/ScreenBuilder";
import type { FavoritesViewModel } from "../viewmodels/FavoritesViewModel";
import { FavoritesAdapter } from "../adapters/FavoritesAdapter";

/** Обёртка над FavoritesAdapter под общий контракт ScreenBuilder. Сама
 *  трансформация ViewModel → ContentBlock[] целиком остаётся в
 *  FavoritesAdapter — здесь не дублируется и не меняется. */
export const FavoritesBuilder: ScreenBuilder<FavoritesViewModel> = {
  build(viewModel) {
    return FavoritesAdapter.toBlocks(viewModel);
  },
};
