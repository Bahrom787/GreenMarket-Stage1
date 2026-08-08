import type { ScreenDefinition } from "./ScreenDefinition";
import type { ScreenBuilder } from "@/platform-core/builders/ScreenBuilder";
import type { ContentBlock } from "@/platform-core/contracts/ContentBlock";

/** ЗАГЛУШКА (согласовано ранее с клиентом: временные экраны-заглушки для
 *  переходов, пока сам экран не реализован по очереди). Seller List не
 *  входит в объём IMP-003.1 — этот файл существует только чтобы переход
 *  Map → Seller List (AR-003) физически работал в навигации уже сейчас.
 *  Полноценная реализация — отдельная задача, со своим ViewModel/Adapter/
 *  Mock Repository по тому же паттерну, что остальные 7 модулей. */
export interface SellerListViewModel {
  placeholder: true;
}

const SellerListBuilder: ScreenBuilder<SellerListViewModel> = {
  build(): ContentBlock[] {
    return [{ type: "empty", text: "Список продавцов появится в следующей итерации" }];
  },
};

export const SellerListScreen: ScreenDefinition<SellerListViewModel> = {
  builder: SellerListBuilder,
  availableActions: ["OPEN_SELLER", "BACK", "CLOSE_SCREEN", "OPEN_CATALOG"] as const,
};
