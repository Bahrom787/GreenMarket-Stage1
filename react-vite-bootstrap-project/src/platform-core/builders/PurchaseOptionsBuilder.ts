import type { ScreenBuilder } from "./ScreenBuilder";
import type { PurchaseOptionsViewModel } from "../purchase_options/viewmodels/PurchaseOptionsViewModel";
import { PurchaseOptionsAdapter } from "../purchase_options/adapters/PurchaseOptionsAdapter";

/** Обёртка над существующим PurchaseOptionsAdapter под общий контракт
 *  ScreenBuilder. Сама трансформация ViewModel → ContentBlock[] целиком
 *  остаётся в PurchaseOptionsAdapter — здесь не дублируется и не меняется. */
export const PurchaseOptionsBuilder: ScreenBuilder<PurchaseOptionsViewModel> = {
  build(viewModel) {
    return PurchaseOptionsAdapter.toBlocks(viewModel);
  },
};
