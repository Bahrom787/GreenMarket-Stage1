import type { ScreenBuilder } from "../../builders/ScreenBuilder";
import type { CatalogViewModel } from "../viewmodels/CatalogViewModel";
import { CatalogAdapter } from "../adapters/CatalogAdapter";

/** Обёртка над CatalogAdapter под общий контракт ScreenBuilder. Сама
 *  трансформация ViewModel → ContentBlock[] целиком остаётся в
 *  CatalogAdapter — здесь не дублируется и не меняется. */
export const CatalogBuilder: ScreenBuilder<CatalogViewModel> = {
  build(viewModel) {
    return CatalogAdapter.toBlocks(viewModel);
  },
};
