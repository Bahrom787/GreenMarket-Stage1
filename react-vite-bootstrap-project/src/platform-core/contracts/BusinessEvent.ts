import type { OptionId, SellerId } from "@/platform-core/contracts/Action";

/** Вынесено из BottomSheetDeclarative.tsx (см. комментарий там, строки 37-48):
 *  тот файл — самодостаточный демо-прототип (1193 строки, тянет lucide-react,
 *  которого нет в зависимостях, и содержит свой закрытый exhaustiveness-switch
 *  по Action, ломающийся при любом расширении Action Catalog). Компилировать
 *  его как часть реального приложения нельзя — а BusinessEvent нужен
 *  GreenMarketRuntime.ts/useGreenMarketRuntime.ts независимо от него.
 *  Тип идентичен оригиналу, ничего не меняет по смыслу. */
export type BusinessEvent =
  | { type: "PURCHASE_CALCULATION_STARTED" }
  | { type: "PURCHASE_OPTION_SELECTED"; payload: { optionId: OptionId; sellerIds: SellerId[]; cost: number } }
  | { type: "SELLER_OPENED"; payload: { sellerId: SellerId } }
  | { type: "ROUTE_STARTED"; payload: { sellerId: SellerId | null } }
  | { type: "EXPLORATION_RESUMED" };

export type BusinessEventType = BusinessEvent["type"];
