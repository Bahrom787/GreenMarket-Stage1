import type { ScreenBuilder } from "../../builders/ScreenBuilder";
import type { BasketViewModel } from "../viewmodels/BasketViewModel";
import { BasketAdapter } from "../adapters/BasketAdapter";

/** Обёртка над BasketAdapter под общий контракт ScreenBuilder. Сама
 *  трансформация ViewModel → ContentBlock[] целиком остаётся в
 *  BasketAdapter — здесь не дублируется и не меняется. */
export const BasketBuilder: ScreenBuilder<BasketViewModel> = {
  build(viewModel) {
    return BasketAdapter.toBlocks(viewModel);
  },
};
