import type { CategoryId } from "./DomainTypes";

/* ============================================================================
 * ОБЩИЕ ИДЕНТИФИКАТОРЫ ПРЕДМЕТНОЙ ОБЛАСТИ
 * Строковые id намеренно brand-типизированы (branded types), чтобы TS не
 * позволял случайно передать productId туда, где ожидается sellerId, и т.п.
 * ========================================================================== */
export type SellerId = string & { readonly __brand: "SellerId" };
export type ProductId = string & { readonly __brand: "ProductId" };
export type OptionId = string & { readonly __brand: "OptionId" };
export const asSellerId = (id: string): SellerId => id as SellerId;
export const asProductId = (id: string): ProductId => id as ProductId;
export const asOptionId = (id: string): OptionId => id as OptionId;

export type SheetHeight = "Hidden" | "Collapsed" | "Half" | "Expanded";

/* ============================================================================
 * ACTION CATALOG (типизированный) — намерение пользователя, Bottom Sheet → Engine.
 * Discriminated union: TS требует, чтобы switch по action.type в редьюсере был
 * исчерпывающим (см. assertNever в BottomSheetDeclarative.tsx) — забытый case
 * подсвечивается на этапе компиляции, а не после релиза.
 *
 * Доменный контракт, не привязан к конкретному экрану: любой будущий экран
 * Customer UI dispatch'ит те же Action и импортирует их отсюда, а не из
 * BottomSheetDeclarative.tsx.
 * ========================================================================== */
export type Action =
  | { type: "OPEN_SEARCH" }
  | { type: "SET_SEARCH_QUERY"; payload: { query: string } }
  | { type: "PICK_PURCHASE" }
  | { type: "SELECT_PURCHASE_OPTION"; payload: { optionId: OptionId } }
  | { type: "OPEN_SELLER"; payload: { sellerId: SellerId } }
  | { type: "OPEN_PRODUCT"; payload: { sellerId: SellerId; productId: ProductId } }
  | { type: "ADD_PRODUCT"; payload: { sellerId: SellerId; productId: ProductId } }
  | { type: "REPLACE_PRODUCT"; payload: { sellerId: SellerId; productId: ProductId } }
  | { type: "START_ROUTE" }
  | { type: "TOGGLE_FAVORITE_SELLER"; payload: { sellerId: SellerId } }
  | { type: "BACK" }
  | { type: "GO_TO_MAIN" }
  | { type: "SET_SHEET_HEIGHT"; payload: { height: SheetHeight } }
  | { type: "TOGGLE_OTHER_PRODUCTS"; payload: { sellerId: SellerId } }
  | { type: "REPORT_MISSING_PRODUCT"; payload: { sellerId: SellerId } }
  | { type: "REPORT_PRICE_CHANGE"; payload: { sellerId: SellerId } }
  | { type: "SHARE_SELLER"; payload: { sellerId: SellerId } }
  | { type: "RETRY_SELLER_LOAD"; payload: { sellerId: SellerId } }
  | { type: "ADD_TO_BASKET"; payload: { sellerId: SellerId; productId: ProductId } }
  | { type: "REMOVE_FROM_BASKET"; payload: { sellerId: SellerId; productId: ProductId } }
  | { type: "SHOW_ON_MAP"; payload: { sellerId: SellerId; productId: ProductId } }
  | { type: "CHANGE_QUANTITY"; payload: { sellerId: SellerId; productId: ProductId; quantity: number } }
  | { type: "CLOSE_SCREEN" }
  | { type: "SEARCH"; payload: { query: string } }
  | { type: "RETRY_SEARCH" }
  | { type: "SELECT_CATEGORY"; payload: { sellerId: SellerId; categoryId: CategoryId } }
  | { type: "REFRESH_CATALOG"; payload: { sellerId: SellerId } }
  | { type: "REFRESH_BASKET" }
  | { type: "START_PURCHASE" }
  | { type: "REMOVE_FROM_FAVORITES"; payload: { sellerId: SellerId; productId: ProductId } }
  | { type: "REFRESH_FAVORITES" };

export type ActionType = Action["type"];
