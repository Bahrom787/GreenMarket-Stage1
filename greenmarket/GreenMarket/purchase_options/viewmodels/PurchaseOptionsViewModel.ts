import type { OptionId, SellerId } from "../../contracts/Action";
import type { AvailableAction } from "../../contracts/ContentBlock";
import type { LoadState } from "../../contracts/LoadState";

/** PurchaseSummary перенесён в contracts/DomainTypes.ts (общий доменный
 *  контракт — используется и здесь, и в BasketViewModel). Реэкспортирован
 *  под тем же именем, чтобы PurchaseOptionsAdapter.ts и
 *  PurchaseOptionsPresentation.ts, которые импортируют его отсюда, не
 *  требовали правок — эти файлы вне списка изменяемых в этой задаче. */
export type { PurchaseSummary } from "../../contracts/DomainTypes";
import type { PurchaseSummary } from "../../contracts/DomainTypes";

/** Вклад одного продавца в вариант покупки — отдельная доменная модель,
 *  чтобы не раздувать PurchaseOptionRecord и переиспользовать её и для
 *  предпросмотра варианта, и для уже выбранного маршрута. */
export interface SellerContribution {
  sellerId: SellerId;
  name: string;
  rating: number;
  distance: string;
}


/** Один вариант покупки — доменная запись по ТЗ-002/ТЗ-015 (Purchase Optimizer).
 *  Ничего не знает про рендеринг (нет CardItem/RowItem и т.п.) и не хранит
 *  готовых строк — только сырые данные. */
export interface PurchaseOptionRecord {
  id: OptionId;
  emoji: string;
  label: string;
  summary: PurchaseSummary;
  sellers: SellerContribution[];
}

/** Маршрут уже выбранного варианта. Рассчитывается отдельно (Purchase
 *  Optimizer/Route Engine) и может отсутствовать, пока расчёт не завершён —
 *  поэтому это самостоятельная модель, а не просто "выбранный
 *  PurchaseOptionRecord". */
export interface SelectedRoute {
  optionId: OptionId;
  sellers: SellerContribution[];
  summary: PurchaseSummary;
}

/** Доменный контракт экрана «Варианты покупки» — то, что реально отдаёт
 *  Backend/Platform Core. Ничего из этого не знает про примитивы разметки —
 *  см. PurchaseOptionsAdapter.toBlocks(). */
export interface PurchaseOptionsViewModel {
  options: PurchaseOptionRecord[];
  selectedOptionId: OptionId | null;
  /** null, пока маршрут для выбранного варианта ещё не рассчитан. */
  selectedRoute: SelectedRoute | null;
  availableActions: AvailableAction[];
  loadState: LoadState;
}
