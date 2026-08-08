import type { ScreenBuilder } from "./ScreenBuilder";
import type { SellerCardViewModel } from "../viewmodels/SellerCardViewModel";
import { SellerCardAdapter } from "../adapters/SellerCardAdapter";

/** Обёртка над существующим SellerCardAdapter под общий контракт
 *  ScreenBuilder. Сама трансформация ViewModel → ContentBlock[] целиком
 *  остаётся в SellerCardAdapter — здесь не дублируется и не меняется. */
export const SellerCardBuilder: ScreenBuilder<SellerCardViewModel> = {
  build(viewModel) {
    return SellerCardAdapter.toBlocks(viewModel);
  },
};
