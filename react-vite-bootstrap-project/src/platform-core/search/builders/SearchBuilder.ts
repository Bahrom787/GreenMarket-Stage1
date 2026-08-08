import type { ScreenBuilder } from "../../builders/ScreenBuilder";
import type { SearchViewModel } from "../viewmodels/SearchViewModel";
import { SearchAdapter } from "../adapters/SearchAdapter";

/** Обёртка над SearchAdapter под общий контракт ScreenBuilder. Сама
 *  трансформация ViewModel → ContentBlock[] целиком остаётся в
 *  SearchAdapter — здесь не дублируется и не меняется. */
export const SearchBuilder: ScreenBuilder<SearchViewModel> = {
  build(viewModel) {
    return SearchAdapter.toBlocks(viewModel);
  },
};
