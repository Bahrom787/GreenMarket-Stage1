import type { Action } from "./Action";

/* ============================================================================
 * ContentBlock — discriminated union примитивов разметки: Bottom Sheet знает
 * только эти теги, не их предметный смысл (нет "продавца"/"товара" в типах
 * ниже — только "list", "coverage", "alerts" и т.д.)
 *
 * Вынесено в отдельный файл: это единственный контракт, который одновременно
 * знают BottomSheetRenderer (потребитель) и *Adapter'ы (поставщики, например
 * SellerCardAdapter). Ни один из них не должен знать внутренности другого.
 * ========================================================================== */
export interface RowItem {
  id: string;
  avatar?: string;
  title: string;
  subtitle?: string;
  trailing?: string;
  /** ТЗ-025 v1.1 §6: признак актуальности/статуса товара — "available" ничего не
   *  показывает, "replacement" и "missing" помечаются бейджем в строке. */
  tag?: "replacement" | "missing";
  /** null = строка кликабельна визуально, но действия не несёт (например, чужой отзыв) */
  action: Action | null;
}

export interface OptionCardItem {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  trailing: string;
  highlighted: boolean;
  action: Action;
}

export interface PhotoItem {
  id: string;
  /** placeholder-цвет вместо реального URL — фото ещё не пришли из макета/Backend,
   *  но lazy-loading и сама структура блока уже рассчитаны на реальные изображения. */
  placeholderColor: string;
}

export type ContentBlock =
  | { type: "progress"; text: string }
  | { type: "sectionLabel"; text: string }
  /** virtualize: true включает windowing в BottomSheetRenderer при большом списке
   *  (ТЗ-025 v1.1 §6 «Производительность»). Для коротких списков не нужен. */
  | { type: "list"; items: RowItem[]; virtualize?: boolean }
  | { type: "cardList"; items: OptionCardItem[] }
  | { type: "coverage"; have: number; total: number; fullyCovered: boolean }
  | { type: "alerts"; items: string[] }
  | { type: "collapsible"; label: string; expanded: boolean; toggleAction: Action; items: RowItem[] }
  | { type: "skeleton" }
  | { type: "errorRetry"; text: string; retryAction: Action }
  | { type: "empty"; text: string }
  | { type: "text"; text: string }
  | { type: "staleBanner"; text: string }
  | { type: "metaLine"; text: string }
  | { type: "priceLine"; text: string }
  | { type: "photoStrip"; items: PhotoItem[] }
  | { type: "hero" };

export type ActionIconKey = "navigation" | "heart" | "plus" | "repeat";
export type ActionVariant = "primary" | "secondary" | "ghost";

export interface AvailableAction {
  id: string;
  /** Готовый Action, а не пара actionType+payload: это исключает рассинхрон
   *  между типом действия и формой его payload на уровне типов. */
  action: Action;
  label: string;
  icon?: ActionIconKey;
  variant: ActionVariant;
  disabled?: boolean;
}
