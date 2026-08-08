import type { ScreenBuilder } from "../../builders/ScreenBuilder";
import type { ProductCardViewModel } from "../viewmodels/ProductCardViewModel";
import { ProductCardAdapter } from "../adapters/ProductCardAdapter";

/** Обёртка над ProductCardAdapter под общий контракт ScreenBuilder. Сама
 *  трансформация ViewModel → ContentBlock[] целиком остаётся в
 *  ProductCardAdapter — здесь не дублируется и не меняется. */
export const ProductCardBuilder: ScreenBuilder<ProductCardViewModel> = {
  build(viewModel) {
    return ProductCardAdapter.toBlocks(viewModel);
  },
};
