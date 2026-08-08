import type { SellerId, ProductId } from "../../contracts/Action";
import type { PhotoItem, AvailableAction } from "../../contracts/ContentBlock";
import type { ViewState } from "../../contracts/ViewState";
import type { PurchaseSummary } from "../../contracts/DomainTypes";

/** BasketId — локальный branded-тип. REFRESH_BASKET и START_PURCHASE (после
 *  добавления в contracts/Action.ts) спроектированы без payload — единая
 *  "текущая" корзина, как и PICK_PURCHASE/RETRY_SEARCH раньше — поэтому
 *  BasketId по-прежнему не требуется ни одному Action и не переносится в
 *  общий контракт, в отличие от PurchaseSummary. */
export type BasketId = string & { readonly __brand: "BasketId" };
export const asBasketId = (id: string): BasketId => id as BasketId;

/** ТЗ-037 §6: элемент корзины. Никаких вычислений внутри — Subtotal уже
 *  посчитан на Backend/Runtime, не в React. */
export interface BasketItem {
  productId: ProductId;
  sellerId: SellerId;
  name: string;
  photo: PhotoItem | null;
  quantity: number;
  unit: string;
  currentPrice: number;
  previousPrice: number | null;
  availability: "available" | "replacement" | "missing";
  subtotal: number;
}

/** Доменный контракт экрана «Корзина» (ТЗ-037 §5). Ничего не знает про
 *  рендеринг. state — общий ViewState. */
export interface BasketViewModel {
  basketId: BasketId;
  items: BasketItem[];
  totalItems: number;
  totalPrice: number;
  savings: number;
  purchaseSummary: PurchaseSummary;
  state: ViewState;
  availableActions: AvailableAction[];
}
