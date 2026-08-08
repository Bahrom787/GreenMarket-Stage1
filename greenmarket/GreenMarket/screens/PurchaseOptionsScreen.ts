import type { ScreenDefinition } from "./ScreenDefinition";
import type { PurchaseOptionsViewModel } from "../purchase_options/viewmodels/PurchaseOptionsViewModel";
import { PurchaseOptionsBuilder } from "../builders/PurchaseOptionsBuilder";

/** Определение экрана «Варианты покупки» — только связывание ViewModel,
 *  Builder'а и списка поддерживаемых Action. Бизнес-логики здесь нет.
 *
 *  ВАЖНО — разграничение с уже существующим файлом
 *  `purchase_options/PurchaseOptionsScreen.tsx`: это два разных объекта с
 *  похожим именем, оставлены как есть по правилу «не переносить и не менять
 *  существующий код»:
 *    - `purchase_options/PurchaseOptionsScreen.tsx` (существующий) — функция
 *      `buildPurchaseOptionsViewModel()`, которая уже собирает полный
 *      Bottom Sheet `ViewModel` (header/toolbar/content/availableActions).
 *    - `screens/PurchaseOptionsScreen.ts` (этот файл, новый) — декларативная
 *      композиция по контракту ScreenDefinition, требуемая последним
 *      инфраструктурным шагом.
 *  Дублирования логики нет: этот файл ничего не вычисляет, только описывает
 *  экран как пару (Builder, доступные действия).
 *
 *  Список действий взят из фактически используемых в PurchaseOptionsAdapter.ts:
 *  SELECT_PURCHASE_OPTION (выбор варианта), OPEN_SELLER (переход к продавцу
 *  из списка маршрута), PICK_PURCHASE (повтор расчёта при ошибке); BACK/
 *  GO_TO_MAIN — универсальная навигация Bottom Sheet.
 *
 *  Отдельно стоит открытый вопрос (не решается этим файлом): PurchaseOptions
 *  пока не подключён к работающему GreenMarketEngine — тот всё ещё использует
 *  свой старый локальный MOCK_OPTIONS с несовместимой формой данных. */
export const PurchaseOptionsScreen: ScreenDefinition<PurchaseOptionsViewModel> = {
  builder: PurchaseOptionsBuilder,
  availableActions: [
    "SELECT_PURCHASE_OPTION",
    "OPEN_SELLER",
    "PICK_PURCHASE",
    "BACK",
    "GO_TO_MAIN",
  ] as const,
};
