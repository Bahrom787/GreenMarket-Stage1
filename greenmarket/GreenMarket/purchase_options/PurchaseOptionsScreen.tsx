import type { ViewModel } from "../BottomSheetDeclarative";
import type { PurchaseOptionsViewModel } from "./viewmodels/PurchaseOptionsViewModel";
import { PurchaseOptionsAdapter } from "./adapters/PurchaseOptionsAdapter";

/** Сборка экрана «Варианты покупки»: PurchaseOptionsViewModel → ViewModel.
 *  Как и BottomSheetDeclarative.tsx для экрана продавца, этот файл не делает
 *  бизнес-преобразований — только компонует header/toolbar/availableActions
 *  и делегирует content.blocks в PurchaseOptionsAdapter.
 *
 *    PurchaseOptionsViewModel → PurchaseOptionsAdapter → ContentBlock[] → BottomSheetRenderer
 */
export function buildPurchaseOptionsViewModel(vm: PurchaseOptionsViewModel, showBack: boolean): ViewModel {
  return {
    height: "Half",
    screenId: "options",
    header: { title: "Варианты покупки", showBack },
    toolbar: null,
    content: { blocks: PurchaseOptionsAdapter.toBlocks(vm) },
    availableActions: showBack
      ? [...vm.availableActions, { id: "go-main", action: { type: "GO_TO_MAIN" }, label: "На главный", variant: "ghost" }]
      : vm.availableActions,
  };
}
