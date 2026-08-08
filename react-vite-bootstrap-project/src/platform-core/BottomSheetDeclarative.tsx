import { useState, useEffect, useRef, useCallback, createContext, useContext, type ReactNode } from "react";
import { ArrowLeft, Search, X, MapPin, Navigation, ShoppingBasket, Heart, Plus, Repeat, type LucideIcon } from "lucide-react";
import { asSellerId, asProductId, asOptionId, type SellerId, type ProductId, type OptionId, type SheetHeight, type Action, type ActionType } from "./contracts/Action";
import type { ProductRecord } from "./contracts/DomainTypes";
import type { RowItem, OptionCardItem, PhotoItem, ContentBlock, AvailableAction, ActionIconKey, ActionVariant } from "./contracts/ContentBlock";
import type { SellerCardViewModel } from "./viewmodels/SellerCardViewModel";
import { SellerCardAdapter } from "./adapters/SellerCardAdapter";

/* Реэкспорт доменных контрактов и adapter'а — публичный API модуля для внешних
 * потребителей не меняется, но сам BottomSheetDeclarative.tsx их больше не
 * объявляет и не является источником для других модулей (см. contracts/,
 * viewmodels/, adapters/) — только сквозной проброс наружу. */
export type { SellerId, ProductId, OptionId, SheetHeight, Action, ActionType } from "./contracts/Action";
export type { ProductRecord } from "./contracts/DomainTypes";
export type { RowItem, OptionCardItem, PhotoItem, ContentBlock, AvailableAction, ActionIconKey, ActionVariant } from "./contracts/ContentBlock";
export type { SellerCardViewModel } from "./viewmodels/SellerCardViewModel";
export { SellerCardAdapter } from "./adapters/SellerCardAdapter";

/* ============================================================================
 * ГРАНИЦА АРХИТЕКТУРЫ — теперь зафиксирована типами, не только соглашением.
 *
 * Bottom Sheet получает только: ViewModel, availableActions, dispatch(Action).
 * GreenMarketEngine работает только с предметной областью и эмитит BusinessEvent.
 * MapProjection — единственный, кто переводит BusinessEvent в вызовы MapController.
 *
 * Смысл переноса на TypeScript: любое расхождение формы объекта между слоями
 * (например, Backend пришлёт Action без обязательного payload, или движок
 * забудет обработать новый тип Action) теперь ловится компилятором, а не
 * рантаймом на проде.
 * ========================================================================== */

/* ============================================================================
 * ОБЩИЕ ИДЕНТИФИКАТОРЫ ПРЕДМЕТНОЙ ОБЛАСТИ, SheetHeight, Action, ActionType —
 * вынесены в ./contracts/Action.ts (доменный контракт, не привязан к экрану).
 * ========================================================================== */

/* ============================================================================
 * EVENT CATALOG (типизированный) — свершившийся факт предметной области,
 * Engine → наружу (сегодня единственный подписчик — MapProjection).
 * ========================================================================== */
export type BusinessEvent =
  | { type: "PURCHASE_CALCULATION_STARTED" }
  | { type: "PURCHASE_OPTION_SELECTED"; payload: { optionId: OptionId; sellerIds: SellerId[]; cost: number } }
  | { type: "SELLER_OPENED"; payload: { sellerId: SellerId } }
  | { type: "ROUTE_STARTED"; payload: { sellerId: SellerId | null } }
  | { type: "EXPLORATION_RESUMED" };

export type BusinessEventType = BusinessEvent["type"];

interface EventBus {
  emit(event: BusinessEvent): void;
  subscribe(fn: (event: BusinessEvent) => void): () => void;
}

function createEventBus(): EventBus {
  const listeners = new Set<(event: BusinessEvent) => void>();
  return {
    emit(event) {
      listeners.forEach((fn) => fn(event));
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

/** Утилита для исчерпывающих switch: если появится новый вариант Action/Event
 *  и его забудут обработать, TS откажется компилировать вызов assertNever. */
function assertNever(x: never): never {
  throw new Error(`Необработанный вариант: ${JSON.stringify(x)}`);
}

/* ============================================================================
 * MapController — типизированный контракт карты. Единственный, кто его
 * вызывает — MapProjection. Ни Bottom Sheet, ни GreenMarketEngine типа
 * MapController в своей сигнатуре не имеют вообще.
 * ========================================================================== */
export interface MapRoute {
  sellerIds: SellerId[];
  cost: number;
}

export type MapMode = "overview" | "picking" | "route" | "seller";

export interface MapState {
  mode: MapMode;
  highlightedSellerIds: SellerId[];
  route: MapRoute | null;
  focusedSellerId: SellerId | null;
}

export interface MapController {
  readonly state: MapState;
  subscribe(fn: (state: MapState) => void): () => void;
  setMode(mode: MapMode): void;
  highlightSellers(ids: SellerId[]): void;
  showRoute(route: MapRoute): void;
  focusSeller(id: SellerId): void;
  reset(): void;
}

/** Mock-реализация — заменяется реальной картой (после ТЗ-025 «Карта») без
 *  изменения типа MapController и без изменения кода, который его вызывает. */
class MockMapProvider implements MapController {
  state: MapState = { mode: "overview", highlightedSellerIds: [], route: null, focusedSellerId: null };
  private listeners = new Set<(state: MapState) => void>();

  subscribe(fn: (state: MapState) => void) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }
  private emit() {
    this.listeners.forEach((fn) => fn(this.state));
  }
  setMode(mode: MapMode) {
    this.state = { ...this.state, mode };
    this.emit();
  }
  highlightSellers(ids: SellerId[]) {
    this.state = { ...this.state, highlightedSellerIds: ids };
    this.emit();
  }
  showRoute(route: MapRoute) {
    this.state = { ...this.state, route };
    this.emit();
  }
  focusSeller(id: SellerId) {
    this.state = { ...this.state, mode: "seller", focusedSellerId: id, highlightedSellerIds: [id] };
    this.emit();
  }
  reset() {
    this.state = { mode: "overview", highlightedSellerIds: [], route: null, focusedSellerId: null };
    this.emit();
  }
}

const MapControllerContext = createContext<MapController | null>(null);
function useMapController(): MapController {
  const ctx = useContext(MapControllerContext);
  if (!ctx) throw new Error("MapControllerContext не предоставлен");
  return ctx;
}
function useMapState(controller: MapController): MapState {
  const [state, setState] = useState(controller.state);
  useEffect(() => controller.subscribe(setState), [controller]);
  return state;
}

/* ============================================================================
 * ViewModel — типизированный контракт того, что рендерит Bottom Sheet.
 * Примитивы разметки (RowItem/OptionCardItem/PhotoItem/ContentBlock) и
 * связанные с ними AvailableAction/ActionIconKey/ActionVariant вынесены в
 * ./contracts/ContentBlock.ts — это единственный общий словарь между
 * BottomSheetRenderer и любыми *Adapter'ами (см. импорт выше).
 * ========================================================================== */
export type HeaderIconKey = "basket";
export interface ViewModelHeader {
  title: string;
  subtitle?: string;
  icon?: HeaderIconKey;
  showBack: boolean;
}

export type Toolbar =
  | { kind: "search-trigger"; placeholder: string; action: Action }
  | { kind: "search-input"; value: string; onChangeAction: (query: string) => Action; clearAction: Action };

export type ScreenId = "main" | "search" | "options" | "seller" | "product";

export interface ViewModel {
  height: SheetHeight;
  screenId: ScreenId;
  header: ViewModelHeader | null;
  toolbar: Toolbar | null;
  content: { blocks: ContentBlock[] };
  availableActions: AvailableAction[];
}

/* SellerCardViewModel — вынесен в ./viewmodels/SellerCardViewModel.ts.
 * SellerCardAdapter (SellerCardViewModel → ContentBlock[]) — вынесен в
 * ./adapters/SellerCardAdapter.ts (импортирован в начале файла). */

/* ------------------------------- Mock-данные ------------------------------ */
interface SellerRecord {
  id: SellerId;
  name: string;
  rating: number;
  distance: string;
  pos: { x: number; y: number };
}
interface PurchaseOptionRecord {
  id: OptionId;
  emoji: string;
  label: string;
  cost: number;
  sellerIds: SellerId[];
  missing: number;
}
interface SellerCardRecord {
  coverage: { have: number; total: number; fullyCovered: boolean };
  alerts: string[];
  info: string;
  otherProducts: ProductRecord[];
  reports: { id: string; title: string; date: string; author?: string; trustLevel?: "high" | "medium" | "low" }[];
  trustLevel: "high" | "medium" | "low";
  lastConfirmedAt: string;
  dataMayBeStale: boolean;
  photos: PhotoItem[];
}

const MOCK_SELLERS: SellerRecord[] = [
  { id: asSellerId("s1"), name: "Ферма Иван", rating: 4.8, distance: "350 м", pos: { x: 32, y: 38 } },
  { id: asSellerId("s2"), name: "Молочная лавка", rating: 4.6, distance: "700 м", pos: { x: 58, y: 55 } },
  { id: asSellerId("s3"), name: "Пасека Мёд", rating: 4.9, distance: "1.1 км", pos: { x: 74, y: 22 } },
  { id: asSellerId("s4"), name: "Овощная база №3", rating: 4.3, distance: "450 м", pos: { x: 44, y: 72 } },
];

const MOCK_OPTIONS: PurchaseOptionRecord[] = [
  { id: asOptionId("o1"), emoji: "⭐", label: "Рекомендуемый", cost: 1240, sellerIds: [asSellerId("s1"), asSellerId("s2"), asSellerId("s3")], missing: 0 },
  { id: asOptionId("o2"), emoji: "❤️", label: "Любимые продавцы", cost: 1390, sellerIds: [asSellerId("s1"), asSellerId("s3")], missing: 1 },
  { id: asOptionId("o3"), emoji: "💰", label: "Минимальная цена", cost: 1090, sellerIds: [asSellerId("s1"), asSellerId("s2"), asSellerId("s3"), asSellerId("s4")], missing: 0 },
  { id: asOptionId("o4"), emoji: "🚶", label: "Минимальный маршрут", cost: 1310, sellerIds: [asSellerId("s1"), asSellerId("s4")], missing: 0 },
];

const MOCK_PRODUCTS: Record<string, ProductRecord[]> = {
  s1: [
    { id: asProductId("p1"), name: "Домашняя колбаса", price: 390, unit: "400 г", availability: "available" },
    { id: asProductId("p2"), name: "Фермерские яйца", price: 180, unit: "10 шт", availability: "available" },
    { id: asProductId("p2a"), name: "Сметана 20%", price: 150, unit: "300 г", availability: "available" },
    { id: asProductId("p2b"), name: "Кефир", price: 95, unit: "1 л", availability: "available" },
    { id: asProductId("p2c"), name: "Творожная запеканка", price: 220, unit: "350 г", availability: "available" },
    { id: asProductId("p2d"), name: "Сыр домашний", price: 480, unit: "300 г", availability: "available" },
    { id: asProductId("p2e"), name: "Йогурт натуральный", price: 130, unit: "400 г", availability: "available" },
    { id: asProductId("p2f"), name: "Масло сливочное", price: 260, unit: "200 г", availability: "replacement" },
    { id: asProductId("p2g"), name: "Редис молодой", price: 70, unit: "пучок", availability: "missing" },
  ],
  s2: [
    { id: asProductId("p3"), name: "Молоко цельное", price: 120, unit: "1 л" },
    { id: asProductId("p4"), name: "Творог домашний", price: 210, unit: "300 г" },
  ],
  s3: [{ id: asProductId("p5"), name: "Мёд гречишный", price: 560, unit: "500 г" }],
  s4: [
    { id: asProductId("p6"), name: "Картофель молодой", price: 89, unit: "1 кг" },
    { id: asProductId("p7"), name: "Помидоры грунтовые", price: 259, unit: "1 кг" },
  ],
};

const MOCK_SELLER_CARD: Record<string, SellerCardRecord> = {
  s1: {
    coverage: { have: 18, total: 22, fullyCovered: false },
    alerts: ["Нет свежей редиски", "Есть молодой шпинат"],
    info: "Специализация: овощи, молочка · Пн–Вс 8:00–20:00 · Наличные, карта",
    otherProducts: [{ id: asProductId("p8"), name: "Зелень пучок", price: 60, unit: "1 пучок" }],
    reports: [{ id: "r1", title: "Качество отличное", date: "сегодня", author: "Мария К.", trustLevel: "high" }],
    trustLevel: "high",
    lastConfirmedAt: "сегодня, 09:14",
    dataMayBeStale: false,
    photos: [
      { id: "ph1", placeholderColor: "#B9CBB6" },
      { id: "ph2", placeholderColor: "#D9C9A8" },
      { id: "ph3", placeholderColor: "#C7B7D6" },
    ],
  },
  s2: {
    coverage: { have: 2, total: 2, fullyCovered: true },
    alerts: [],
    info: "Специализация: молочная продукция · Вт–Вс 9:00–18:00",
    otherProducts: [],
    reports: [],
    trustLevel: "medium",
    lastConfirmedAt: "3 дня назад",
    dataMayBeStale: true,
    photos: [],
  },
  s3: {
    coverage: { have: 1, total: 1, fullyCovered: true },
    alerts: ["Сегодня скидка на мёд"],
    info: "Специализация: мёд, продукты пчеловодства · Сб–Вс 10:00–16:00",
    otherProducts: [{ id: asProductId("p9"), name: "Прополис", price: 340, unit: "50 г" }],
    reports: [],
    trustLevel: "high",
    lastConfirmedAt: "сегодня, 07:40",
    dataMayBeStale: false,
    photos: [{ id: "ph4", placeholderColor: "#E8C9A0" }],
  },
  s4: {
    coverage: { have: 0, total: 2, fullyCovered: false },
    alerts: [],
    info: "Специализация: овощи · Пн–Сб 7:00–19:00",
    otherProducts: [],
    reports: [{ id: "r2", title: "Сегодня товара не было", date: "вчера", author: "Игорь П.", trustLevel: "medium" }],
    trustLevel: "low",
    lastConfirmedAt: "неделю назад",
    dataMayBeStale: true,
    photos: [],
  },
};

const STORAGE_KEY = "bottomsheet-declarative-state-ts";
const HEIGHTS: Record<SheetHeight, number> = { Hidden: 0, Collapsed: 0.24, Half: 0.55, Expanded: 0.9 };
const SNAP_ORDER: SheetHeight[] = ["Collapsed", "Half", "Expanded"];

/* ============================================================================
 * GreenMarketEngine — типизированный стек навигации, состояние движка,
 * dispatch(Action) c исчерпывающим switch, сборка ViewModel.
 * ========================================================================== */
export type StackEntry =
  | { screen: "main"; params: Record<string, never> }
  | { screen: "search"; params: Record<string, never> }
  | { screen: "options"; params: Record<string, never> }
  | { screen: "seller"; params: { sellerId: SellerId } }
  | { screen: "product"; params: { sellerId: SellerId; productId: ProductId } };

interface EngineState {
  stack: StackEntry[];
  height: SheetHeight;
  query: string;
  calculating: boolean;
  selectedOptionId: OptionId | null;
  favorites: Set<SellerId>;
  basketCount: number;
  restored: boolean;
  sellerLoad: { sellerId: SellerId; status: "loading" | "error" | "ready" } | null;
  otherExpanded: Set<SellerId>;
  failedOnce: Set<SellerId>;
}

function useGreenMarketEngine(eventBus: EventBus): { viewModel: ViewModel; dispatch: (action: Action) => void } {
  const [state, setState] = useState<EngineState>({
    stack: [{ screen: "main", params: {} }],
    height: "Collapsed",
    query: "",
    calculating: false,
    selectedOptionId: null,
    favorites: new Set([asSellerId("s1"), asSellerId("s3")]),
    basketCount: 12,
    restored: false,
    sellerLoad: null,
    otherExpanded: new Set(),
    failedOnce: new Set(),
  });

  // имитация загрузки карточки продавца (skeleton/error/ready)
  useEffect(() => {
    if (!state.sellerLoad || state.sellerLoad.status !== "loading") return;
    const { sellerId } = state.sellerLoad;
    const t = setTimeout(() => {
      setState((s) => {
        const shouldFail = sellerId === "s4" && !s.failedOnce.has(sellerId);
        const failedOnce = shouldFail ? new Set(s.failedOnce).add(sellerId) : s.failedOnce;
        return { ...s, sellerLoad: { sellerId, status: shouldFail ? "error" : "ready" }, failedOnce };
      });
    }, 700);
    return () => clearTimeout(t);
  }, [state.sellerLoad]);

  // восстановление состояния (ТЗ-024 п.16)
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res?.value) {
          const saved = JSON.parse(res.value) as { stack?: StackEntry[]; height?: SheetHeight };
          setState((s) => ({
            ...s,
            stack: saved.stack?.length ? saved.stack : s.stack,
            height: saved.height ?? s.height,
          }));
        }
      } catch {
        /* ключа ещё нет */
      } finally {
        setState((s) => ({ ...s, restored: true }));
      }
    })();
  }, []);

  useEffect(() => {
    if (!state.restored) return;
    window.storage.set(STORAGE_KEY, JSON.stringify({ stack: state.stack, height: state.height }), false).catch(() => {});
  }, [state.stack, state.height, state.restored]);

  // асинхронный "расчёт" — в реальной системе ответ Backend/Purchase Optimizer
  useEffect(() => {
    if (!state.calculating) return;
    const t = setTimeout(() => {
      setState((s) => ({ ...s, calculating: false, stack: [...s.stack, { screen: "options", params: {} }], height: "Half" }));
    }, 1200);
    return () => clearTimeout(t);
  }, [state.calculating]);

  const dispatch = useCallback(
    (action: Action) => {
      setState((s): EngineState => {
        switch (action.type) {
          case "OPEN_SEARCH":
            return { ...s, stack: [...s.stack, { screen: "search", params: {} }], height: "Half" };
          case "SET_SEARCH_QUERY":
            return { ...s, query: action.payload.query };
          case "PICK_PURCHASE":
            eventBus.emit({ type: "PURCHASE_CALCULATION_STARTED" });
            return { ...s, calculating: true };
          case "SELECT_PURCHASE_OPTION": {
            const opt = MOCK_OPTIONS.find((o) => o.id === action.payload.optionId);
            if (!opt) return s;
            eventBus.emit({ type: "PURCHASE_OPTION_SELECTED", payload: { optionId: opt.id, sellerIds: opt.sellerIds, cost: opt.cost } });
            return { ...s, selectedOptionId: action.payload.optionId, height: "Half" };
          }
          case "OPEN_SELLER":
            eventBus.emit({ type: "SELLER_OPENED", payload: { sellerId: action.payload.sellerId } });
            return {
              ...s,
              stack: [...s.stack, { screen: "seller", params: { sellerId: action.payload.sellerId } }],
              height: "Expanded",
              sellerLoad: { sellerId: action.payload.sellerId, status: "loading" },
            };
          case "RETRY_SELLER_LOAD":
            return { ...s, sellerLoad: { sellerId: action.payload.sellerId, status: "loading" } };
          case "TOGGLE_OTHER_PRODUCTS": {
            const otherExpanded = new Set(s.otherExpanded);
            otherExpanded.has(action.payload.sellerId) ? otherExpanded.delete(action.payload.sellerId) : otherExpanded.add(action.payload.sellerId);
            return { ...s, otherExpanded };
          }
          case "REPORT_MISSING_PRODUCT":
          case "REPORT_PRICE_CHANGE":
          case "SHARE_SELLER":
            return s; // заглушка: реальная отправка — задача Backend, не Bottom Sheet
          case "OPEN_PRODUCT":
            return { ...s, stack: [...s.stack, { screen: "product", params: action.payload }], height: "Expanded" };
          case "START_ROUTE": {
            const top = s.stack[s.stack.length - 1];
            const sellerId = top.screen === "seller" ? top.params.sellerId : null;
            eventBus.emit({ type: "ROUTE_STARTED", payload: { sellerId } });
            return s;
          }
          case "TOGGLE_FAVORITE_SELLER": {
            const favorites = new Set(s.favorites);
            favorites.has(action.payload.sellerId) ? favorites.delete(action.payload.sellerId) : favorites.add(action.payload.sellerId);
            return { ...s, favorites };
          }
          case "ADD_PRODUCT":
            return { ...s, basketCount: s.basketCount + 1 };
          case "REPLACE_PRODUCT":
            return s;
          case "BACK":
            return s.stack.length > 1 ? { ...s, stack: s.stack.slice(0, -1) } : s;
          case "GO_TO_MAIN":
            eventBus.emit({ type: "EXPLORATION_RESUMED" });
            return { ...s, stack: [{ screen: "main", params: {} }], height: "Collapsed", selectedOptionId: null };
          case "SET_SHEET_HEIGHT":
            return { ...s, height: action.payload.height };
          // no-op: экран ProductCardScreen пока не подключён к этому движку,
          // обработка появится вместе с реальным подключением экрана
          case "ADD_TO_BASKET":
          case "REMOVE_FROM_BASKET":
          case "SHOW_ON_MAP":
          case "CHANGE_QUANTITY":
          case "CLOSE_SCREEN":
            return s;
          case "SELECT_CATEGORY":
          case "REFRESH_CATALOG":
            return s;
          case "REFRESH_BASKET":
          case "START_PURCHASE":
            return s;
          case "REMOVE_FROM_FAVORITES":
          case "REFRESH_FAVORITES":
            return s;
          default:
            return assertNever(action);
        }
      });
    },
    [eventBus]
  );

  return { viewModel: buildViewModel(state), dispatch };
}

/* ------------------------- сборка ViewModel (декларативно) ------------------------- */
function buildViewModel(state: EngineState): ViewModel {
  const current = state.stack[state.stack.length - 1];
  const showBack = state.stack.length > 1;
  const base: ViewModel = { height: state.height, screenId: current.screen, header: null, toolbar: null, content: { blocks: [] }, availableActions: [] };

  if (current.screen === "main") {
    base.header = { title: `Покупка на сегодня, ${state.basketCount} товаров`, subtitle: `${state.basketCount} товаров в корзине`, icon: "basket", showBack };
    base.toolbar = { kind: "search-trigger", placeholder: "Найти продавца или товар", action: { type: "OPEN_SEARCH" } };
    if (state.calculating) base.content.blocks.push({ type: "progress", text: "Считаем оптимальный вариант…" });
    base.content.blocks.push({ type: "sectionLabel", text: "Избранные продавцы рядом" });
    base.content.blocks.push({ type: "list", items: MOCK_SELLERS.filter((s) => state.favorites.has(s.id)).map((s) => sellerRow(s, state.favorites)) });
    if (state.selectedOptionId) {
      base.content.blocks.push({ type: "text", text: `Выбран вариант: ${MOCK_OPTIONS.find((o) => o.id === state.selectedOptionId)?.label ?? ""}` });
    }
    base.availableActions.push({ id: "pick", action: { type: "PICK_PURCHASE" }, label: state.calculating ? "Подбираем…" : "Подобрать покупку", variant: "primary", disabled: state.calculating });
  }

  if (current.screen === "search") {
    base.header = { title: "Поиск", showBack };
    base.toolbar = {
      kind: "search-input",
      value: state.query,
      onChangeAction: (query) => ({ type: "SET_SEARCH_QUERY", payload: { query } }),
      clearAction: { type: "SET_SEARCH_QUERY", payload: { query: "" } },
    };
    const q = state.query.trim().toLowerCase();
    if (!q) {
      base.content.blocks.push({ type: "sectionLabel", text: "Недавние запросы" });
      base.content.blocks.push({ type: "empty", text: "Начните вводить название продавца или товара" });
    } else {
      const results = MOCK_SELLERS.filter((s) => s.name.toLowerCase().includes(q));
      if (results.length === 0) base.content.blocks.push({ type: "empty", text: `Ничего не найдено по запросу «${state.query}»` });
      else base.content.blocks.push({ type: "list", items: results.map((s) => sellerRow(s, state.favorites)) });
    }
  }

  if (current.screen === "options") {
    base.header = { title: "Варианты покупки", showBack };
    base.content.blocks.push({
      type: "cardList",
      items: MOCK_OPTIONS.map(
        (o): OptionCardItem => ({
          id: o.id,
          emoji: o.emoji,
          title: o.label,
          subtitle: `${o.sellerIds.length} продавца · ${o.missing ? `${o.missing} товара нет в наличии` : "всё в наличии"}`,
          trailing: `${o.cost} ₽`,
          highlighted: state.selectedOptionId === o.id,
          action: { type: "SELECT_PURCHASE_OPTION", payload: { optionId: o.id } },
        })
      ),
    });
    if (state.selectedOptionId) {
      const opt = MOCK_OPTIONS.find((o) => o.id === state.selectedOptionId);
      if (opt) {
        base.content.blocks.push({ type: "sectionLabel", text: "Продавцы в маршруте" });
        base.content.blocks.push({
          type: "list",
          items: opt.sellerIds.map((id) => sellerRow(MOCK_SELLERS.find((s) => s.id === id)!, state.favorites)),
        });
      }
    }
  }

  if (current.screen === "seller") {
    const sellerId = current.params.sellerId;
    const seller = MOCK_SELLERS.find((s) => s.id === sellerId);
    const isFav = state.favorites.has(sellerId);
    const card = MOCK_SELLER_CARD[sellerId];
    const load = state.sellerLoad && state.sellerLoad.sellerId === sellerId ? state.sellerLoad.status : "ready";

    base.header = seller
      ? { title: seller.name, subtitle: `⭐ ${seller.rating} · ${seller.distance}${isFav ? " · ❤️ Любимый" : ""}`, showBack }
      : { title: "Продавец", showBack };

    if (!seller) {
      base.content.blocks.push({ type: "empty", text: "Продавец не найден" });
    } else {
      // Здесь Backend/Platform Core в реальной системе прислал бы уже готовый
      // SellerCardViewModel целиком; mock ниже собирает его из тестовых записей
      // ровно так, как это делал бы SellerCardBuilder.
      const sellerCardVm: SellerCardViewModel = {
        seller: { id: seller.id, name: seller.name, rating: seller.rating, distance: seller.distance },
        coverage: card?.coverage ?? { have: 0, total: 0, fullyCovered: false },
        importantAlerts: card?.alerts ?? [],
        basketProducts: MOCK_PRODUCTS[sellerId] ?? [],
        otherProducts: card?.otherProducts ?? [],
        trustInfo: card?.info ?? "",
        trustLevel: card?.trustLevel ?? "medium",
        lastConfirmedAt: card?.lastConfirmedAt ?? "",
        dataMayBeStale: card?.dataMayBeStale ?? false,
        photos: card?.photos ?? [],
        availableActions: [], // формируются ниже, вместе с общими для экрана
        reports: card?.reports ?? [],
        isFavorite: isFav,
        otherProductsExpanded: state.otherExpanded.has(sellerId),
        loadState: load,
      };
      base.content.blocks.push(...SellerCardAdapter.toBlocks(sellerCardVm));
    }

    base.availableActions.push(
      { id: "route", action: { type: "START_ROUTE" }, label: "Начать маршрут", icon: "navigation", variant: "primary" },
      { id: "fav", action: { type: "TOGGLE_FAVORITE_SELLER", payload: { sellerId } }, label: isFav ? "В избранном" : "Избранное", icon: "heart", variant: "secondary" },
      { id: "report", action: { type: "REPORT_MISSING_PRODUCT", payload: { sellerId } }, label: "Сообщить об отсутствии", variant: "ghost" }
    );
  }

  if (current.screen === "product") {
    const { sellerId, productId } = current.params;
    const product = (MOCK_PRODUCTS[sellerId] ?? []).find((p) => p.id === productId);
    base.header = { title: product?.name ?? "Товар", showBack };
    if (product) {
      base.content.blocks.push({ type: "hero" });
      base.content.blocks.push({ type: "priceLine", text: `${product.price} ₽ / ${product.unit}` });
      base.content.blocks.push({ type: "text", text: "Заглушка карточки товара — отдельного ТЗ-004 в архиве нет, поля ориентировочные." });
    } else {
      base.content.blocks.push({ type: "empty", text: "Товар не найден" });
    }
    base.availableActions.push(
      { id: "add", action: { type: "ADD_PRODUCT", payload: { sellerId, productId } }, label: "Добавить", icon: "plus", variant: "primary" },
      { id: "replace", action: { type: "REPLACE_PRODUCT", payload: { sellerId, productId } }, label: "Заменить", icon: "repeat", variant: "secondary" }
    );
  }

  if (showBack) base.availableActions.push({ id: "go-main", action: { type: "GO_TO_MAIN" }, label: "На главный", variant: "ghost" });

  return base;
}

function sellerRow(seller: SellerRecord, favorites: Set<SellerId>): RowItem {
  return {
    id: seller.id,
    avatar: favorites.has(seller.id) ? "❤️" : "🏪",
    title: seller.name,
    subtitle: `⭐ ${seller.rating} · ${seller.distance}`,
    action: { type: "OPEN_SELLER", payload: { sellerId: seller.id } },
  };
}

/* ============================================================================
 * MapProjection — единственный слой, переводящий BusinessEvent → MapController.
 * ========================================================================== */
function useMapProjection(eventBus: EventBus, mapController: MapController): void {
  useEffect(() => {
    return eventBus.subscribe((event) => {
      switch (event.type) {
        case "PURCHASE_CALCULATION_STARTED":
          mapController.setMode("picking");
          break;
        case "PURCHASE_OPTION_SELECTED":
          mapController.highlightSellers(event.payload.sellerIds);
          mapController.showRoute({ sellerIds: event.payload.sellerIds, cost: event.payload.cost });
          break;
        case "SELLER_OPENED":
          mapController.focusSeller(event.payload.sellerId);
          break;
        case "ROUTE_STARTED":
          mapController.setMode("route");
          break;
        case "EXPLORATION_RESUMED":
          mapController.reset();
          break;
        default:
          assertNever(event);
      }
    });
  }, [eventBus, mapController]);
}

/* ============================================================================
 * Bottom Sheet — чисто декларативный рендерер типизированного ViewModel.
 * ========================================================================== */
const ICONS: Record<HeaderIconKey | ActionIconKey, LucideIcon> = {
  basket: ShoppingBasket,
  navigation: Navigation,
  heart: Heart,
  plus: Plus,
  repeat: Repeat,
};

interface BottomSheetProps {
  viewModel: ViewModel;
  dispatch: (action: Action) => void;
  frameHeight: number;
}

/** ТЗ-025 v1.1 §3: Sticky Header с компактным режимом при прокрутке контента.
 *  "Sticky" здесь — структурное свойство: Header рендерится вне скроллящегося
 *  .gm-content, поэтому никогда не уезжает сам по себе. Компактный режим —
 *  единственное, что реально управляется скроллом (через contentScroll ниже).
 *  Порог в px подобран эмпирически для текущего размера карточки — вынесен
 *  константой, чтобы не расползался по коду. */
const HEADER_COMPACT_SCROLL_THRESHOLD = 24;

/** Последний узел конвейера: SellerCardViewModel → SellerCardAdapter →
 *  ContentBlock[] → BottomSheetRenderer. Ничего не знает про домен —
 *  только про типы блоков разметки (ContentBlock) и Action. */
function BottomSheetRenderer({ viewModel, dispatch, frameHeight }: BottomSheetProps) {
  const [dragPx, setDragPx] = useState<number | null>(null);
  const dragState = useRef<{ startY: number; startPx: number } | null>(null);
  const [contentScroll, setContentScroll] = useState({ scrollTop: 0, clientHeight: 0 });
  const contentRef = useRef<HTMLDivElement | null>(null);

  const officialPercent = HEIGHTS[viewModel.height];
  const currentPx = dragPx !== null ? dragPx : officialPercent * frameHeight;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = { startY: e.clientY, startPx: officialPercent * frameHeight };
    e.currentTarget.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const delta = dragState.current.startY - e.clientY;
    const next = Math.min(frameHeight * 0.92, Math.max(frameHeight * 0.12, dragState.current.startPx + delta));
    setDragPx(next);
  };
  const onPointerUp = () => {
    if (dragPx === null) return;
    let nearest: SheetHeight = SNAP_ORDER[0];
    let best = Infinity;
    for (const h of SNAP_ORDER) {
      const d = Math.abs(HEIGHTS[h] * frameHeight - dragPx);
      if (d < best) {
        best = d;
        nearest = h;
      }
    }
    setDragPx(null);
    dragState.current = null;
    dispatch({ type: "SET_SHEET_HEIGHT", payload: { height: nearest } });
  };

  const onContentScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const el = e.currentTarget;
    setContentScroll({ scrollTop: el.scrollTop, clientHeight: el.clientHeight });
  };

  // сброс скролла/компактности при смене экрана — новый ViewModel = новый контент
  useEffect(() => {
    if (contentRef.current) contentRef.current.scrollTop = 0;
    setContentScroll({ scrollTop: 0, clientHeight: contentRef.current?.clientHeight ?? 0 });
  }, [viewModel.screenId]);

  const HeaderIcon = viewModel.header?.icon ? ICONS[viewModel.header.icon] : null;
  const headerCompact = contentScroll.scrollTop > HEADER_COMPACT_SCROLL_THRESHOLD;

  return (
    <div className="gm-sheet" style={{ height: `${currentPx}px`, transition: dragPx !== null ? "none" : "height 260ms cubic-bezier(.2,.8,.2,1)" }}>
      <div className="gm-handle" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <div className="gm-handle-bar" />
      </div>

      {viewModel.header && (
        <div className={`gm-header ${headerCompact ? "gm-header-compact" : ""}`}>
          {viewModel.header.showBack ? (
            <button className="gm-icon-btn" onClick={() => dispatch({ type: "BACK" })} aria-label="Назад">
              <ArrowLeft size={18} />
            </button>
          ) : (
            HeaderIcon && <HeaderIcon size={18} className="gm-header-icon" />
          )}
          <div className="gm-header-text">
            <div className="gm-header-title">{viewModel.header.title}</div>
            {viewModel.header.subtitle && !headerCompact && <div className="gm-header-sub">{viewModel.header.subtitle}</div>}
          </div>
        </div>
      )}

      {viewModel.toolbar?.kind === "search-trigger" && (
        <div className="gm-toolbar">
          <button className="gm-search-input" onClick={() => dispatch(viewModel.toolbar!.action as Action)}>
            <Search size={16} />
            <span>{viewModel.toolbar.placeholder}</span>
          </button>
        </div>
      )}
      {viewModel.toolbar?.kind === "search-input" && (
        <div className="gm-toolbar">
          <div className="gm-search-input gm-search-active">
            <Search size={16} />
            <input
              autoFocus
              placeholder="Поиск…"
              value={viewModel.toolbar.value}
              onChange={(e) => dispatch(viewModel.toolbar!.kind === "search-input" ? (viewModel.toolbar as Extract<Toolbar, { kind: "search-input" }>).onChangeAction(e.target.value) : { type: "SET_SEARCH_QUERY", payload: { query: e.target.value } })}
            />
            {viewModel.toolbar.value && (
              <button className="gm-icon-btn gm-icon-btn-tiny" onClick={() => dispatch((viewModel.toolbar as Extract<Toolbar, { kind: "search-input" }>).clearAction)}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="gm-content" ref={contentRef} onScroll={onContentScroll}>
        <ContentBlocks blocks={viewModel.content.blocks} dispatch={dispatch} scrollTop={contentScroll.scrollTop} viewportHeight={contentScroll.clientHeight} />
      </div>

      {viewModel.availableActions.length > 0 && (
        <div className="gm-actions">
          {viewModel.availableActions.map((a) => {
            const Icon = a.icon ? ICONS[a.icon] : null;
            const cls = a.variant === "primary" ? "gm-btn-primary" : a.variant === "ghost" ? "gm-btn-ghost" : "gm-btn-secondary";
            return (
              <button key={a.id} className={cls} disabled={a.disabled} onClick={() => dispatch(a.action)}>
                {Icon && <Icon size={15} />} {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ item, dispatch }: { item: RowItem; dispatch: (action: Action) => void }) {
  return (
    <button className={`gm-row ${item.tag ? `gm-row-tag-${item.tag}` : ""}`} disabled={!item.action} onClick={() => item.action && dispatch(item.action)}>
      <span className="gm-row-avatar">{item.avatar}</span>
      <span className="gm-row-body">
        <span className="gm-row-title">
          {item.title}
          {item.tag === "replacement" && <span className="gm-row-badge gm-row-badge-replacement">замена</span>}
          {item.tag === "missing" && <span className="gm-row-badge gm-row-badge-missing">нет в наличии</span>}
        </span>
        <span className="gm-row-meta">{item.subtitle}</span>
      </span>
      {item.trailing && <span className="gm-row-price">{item.trailing}</span>}
    </button>
  );
}

/* ============================================================================
 * Виртуализация длинных списков (ТЗ-025 v1.1 §6 «Производительность»).
 * Простое windowing по оценочной высоте строки — без внешних зависимостей.
 * Рендерит только видимые элементы + буфер, остальное — через spacer-высоту,
 * чтобы скролл-контейнер сохранял корректную полную высоту.
 * ========================================================================== */
const ROW_HEIGHT_ESTIMATE = 56;
const VIRTUALIZE_BUFFER_ROWS = 4;

function VirtualRowList({
  items,
  dispatch,
  scrollTop,
  viewportHeight,
  listTopOffset,
}: {
  items: RowItem[];
  dispatch: (action: Action) => void;
  scrollTop: number;
  viewportHeight: number;
  /** Смещение начала этого списка от верха скролл-контейнера — без него
   *  windowing считал бы от верха контента целиком, а не от начала списка. */
  listTopOffset: number;
}) {
  const relativeScroll = Math.max(0, scrollTop - listTopOffset);
  const startIndex = Math.max(0, Math.floor(relativeScroll / ROW_HEIGHT_ESTIMATE) - VIRTUALIZE_BUFFER_ROWS);
  const visibleCount = Math.ceil((viewportHeight || 400) / ROW_HEIGHT_ESTIMATE) + VIRTUALIZE_BUFFER_ROWS * 2;
  const endIndex = Math.min(items.length, startIndex + visibleCount);

  const topSpacer = startIndex * ROW_HEIGHT_ESTIMATE;
  const bottomSpacer = (items.length - endIndex) * ROW_HEIGHT_ESTIMATE;

  return (
    <div className="gm-list">
      {topSpacer > 0 && <div style={{ height: topSpacer }} aria-hidden />}
      {items.slice(startIndex, endIndex).map((item) => (
        <Row key={item.id} item={item} dispatch={dispatch} />
      ))}
      {bottomSpacer > 0 && <div style={{ height: bottomSpacer }} aria-hidden />}
    </div>
  );
}

/** Ленивая фотолента (ТЗ-025 v1.1 §10): реальное изображение не подгружается,
 *  пока карточка не попала во вьюпорт скролл-контейнера. */
function LazyPhoto({ photo }: { photo: PhotoItem }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current || visible) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setVisible(true);
      },
      { threshold: 0.1 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="gm-photo" style={{ background: visible ? photo.placeholderColor : "#E3E0D3" }}>
      {!visible && <div className="gm-photo-shimmer" />}
    </div>
  );
}


/** Приблизительная высота блока для расчёта смещения виртуализируемого списка
 *  относительно начала скролл-контейнера. Не претендует на точность до пикселя —
 *  этого достаточно для корректного выбора окна видимых строк. */
function estimateBlockHeight(b: ContentBlock): number {
  switch (b.type) {
    case "progress":
      return 56;
    case "sectionLabel":
      return 28;
    case "list":
    case "cardList":
      return b.items.length * ROW_HEIGHT_ESTIMATE;
    case "coverage":
      return 84;
    case "alerts":
      return b.items.length * 32;
    case "collapsible":
      return 36 + (b.expanded ? b.items.length * ROW_HEIGHT_ESTIMATE : 0);
    case "skeleton":
      return 100;
    case "errorRetry":
      return 90;
    case "empty":
      return 70;
    case "text":
      return 40;
    case "staleBanner":
      return 32;
    case "metaLine":
      return 24;
    case "priceLine":
      return 30;
    case "photoStrip":
      return 96;
    case "hero":
      return 120;
    default:
      return assertNever(b);
  }
}

function ContentBlocks({
  blocks,
  dispatch,
  scrollTop,
  viewportHeight,
}: {
  blocks: ContentBlock[];
  dispatch: (action: Action) => void;
  scrollTop: number;
  viewportHeight: number;
}): ReactNode {
  let runningOffset = 0;

  return blocks.map((b, i) => {
    const listTopOffset = runningOffset;
    runningOffset += estimateBlockHeight(b);

    switch (b.type) {
      case "progress":
        return (
          <div className="gm-progress" key={i}>
            <div className="gm-progress-bar" />
            <span>{b.text}</span>
          </div>
        );
      case "sectionLabel":
        return <div className="gm-section-label" key={i}>{b.text}</div>;
      case "list":
        return b.virtualize ? (
          <VirtualRowList key={i} items={b.items} dispatch={dispatch} scrollTop={scrollTop} viewportHeight={viewportHeight} listTopOffset={listTopOffset} />
        ) : (
          <div className="gm-list" key={i}>
            {b.items.map((item) => (
              <Row key={item.id} item={item} dispatch={dispatch} />
            ))}
          </div>
        );
      case "coverage":
        return (
          <div className="gm-coverage" key={i}>
            <div className="gm-coverage-title">{b.fullyCovered ? "Корзина закрывается полностью" : "Корзина закрывается"}</div>
            <div className="gm-coverage-value">{b.have} из {b.total} товаров</div>
            <div className="gm-coverage-bar"><div className="gm-coverage-bar-fill" style={{ width: `${Math.round((b.have / b.total) * 100)}%` }} /></div>
          </div>
        );
      case "alerts":
        return (
          <div className="gm-alerts" key={i}>
            {b.items.map((text, idx) => <div className="gm-alert-row" key={idx}>{text}</div>)}
          </div>
        );
      case "collapsible":
        return (
          <div key={i}>
            <button className="gm-collapsible-toggle" onClick={() => dispatch(b.toggleAction)}>
              {b.expanded ? "▾" : "▸"} {b.label}
            </button>
            {b.expanded && (
              <div className="gm-list">
                {b.items.map((item) => <Row key={item.id} item={item} dispatch={dispatch} />)}
              </div>
            )}
          </div>
        );
      case "skeleton":
        return (
          <div className="gm-skeleton" key={i}>
            <div className="gm-skeleton-line gm-skeleton-w60" />
            <div className="gm-skeleton-line gm-skeleton-w90" />
            <div className="gm-skeleton-line gm-skeleton-w40" />
            <div className="gm-skeleton-line gm-skeleton-w80" />
          </div>
        );
      case "errorRetry":
        return (
          <div className="gm-error" key={i}>
            <div>{b.text}</div>
            <button className="gm-btn-secondary" onClick={() => dispatch(b.retryAction)}>Повторить</button>
          </div>
        );
      case "cardList":
        return (
          <div className="gm-list" key={i}>
            {b.items.map((item) => (
              <button key={item.id} className={`gm-option-card ${item.highlighted ? "gm-option-card-active" : ""}`} onClick={() => dispatch(item.action)}>
                <span className="gm-option-emoji">{item.emoji}</span>
                <span className="gm-option-body">
                  <span className="gm-option-title">{item.title}</span>
                  <span className="gm-option-meta">{item.subtitle}</span>
                </span>
                <span className="gm-option-cost">{item.trailing}</span>
              </button>
            ))}
          </div>
        );
      case "empty":
        return <div className="gm-empty" key={i}>{b.text}</div>;
      case "text":
        return <div className="gm-hint" key={i}>{b.text}</div>;
      case "staleBanner":
        return <div className="gm-stale-banner" key={i}>⚠️ {b.text}</div>;
      case "metaLine":
        return <div className="gm-seller-meta" key={i}>{b.text}</div>;
      case "priceLine":
        return <div className="gm-product-price" key={i}>{b.text}</div>;
      case "photoStrip":
        return (
          <div className="gm-photo-strip" key={i}>
            {b.items.map((photo) => <LazyPhoto key={photo.id} photo={photo} />)}
          </div>
        );
      case "hero":
        return <div className="gm-product-hero" key={i} />;
      default:
        return assertNever(b);
    }
  });
}

/* ------------------------- слой карты (без изменений) ------------------------- */
function MapLayer() {
  const mapController = useMapController();
  const mapState = useMapState(mapController);
  return (
    <div className="gm-map">
      <div className="gm-map-you" title="Вы здесь" />
      {MOCK_SELLERS.map((s) => {
        const active = mapState.highlightedSellerIds.includes(s.id) || mapState.focusedSellerId === s.id;
        return (
          <div key={s.id} className={`gm-map-pin ${active ? "gm-map-pin-active" : ""}`} style={{ left: `${s.pos.x}%`, top: `${s.pos.y}%` }}>
            <MapPin size={active ? 22 : 16} />
          </div>
        );
      })}
      {mapState.route && <div className="gm-map-route-badge">Маршрут: {mapState.route.sellerIds.length} точки · {mapState.route.cost} ₽</div>}
      <div className="gm-map-mode-badge">mock MapProvider · mode: {mapState.mode}</div>
    </div>
  );
}

/* --------------------------------- App --------------------------------- */
function Root() {
  const mapController = useMapController();
  const eventBusRef = useRef<EventBus | null>(null);
  if (!eventBusRef.current) eventBusRef.current = createEventBus();
  const eventBus = eventBusRef.current;

  useMapProjection(eventBus, mapController);
  const { viewModel, dispatch } = useGreenMarketEngine(eventBus);
  const frameHeight = 760;

  return (
    <div className="gm-root">
      <div className="gm-frame">
        <div className="gm-statusbar"><span>9:41</span><span>●●●</span></div>
        <MapLayer />
        <BottomSheetRenderer viewModel={viewModel} dispatch={dispatch} frameHeight={frameHeight} />
      </div>
      <div className="gm-caption">
        TypeScript-версия: <code>Action</code>, <code>BusinessEvent</code>, <code>ViewModel</code> и{" "}
        <code>MapController</code> — типизированные контракты между слоями (см. комментарии в начале файла).
      </div>
    </div>
  );
}

export default function App() {
  const controllerRef = useRef<MapController | null>(null);
  if (!controllerRef.current) controllerRef.current = new MockMapProvider();

  return (
    <MapControllerContext.Provider value={controllerRef.current}>
      <style>{`
        .gm-root { display:flex; flex-direction:column; align-items:center; gap:14px; font-family: -apple-system, "Segoe UI", Roboto, sans-serif; padding: 24px 12px; background:#EFEDE4; min-height:100%; box-sizing:border-box; }
        .gm-caption { color:#5B6459; font-size:12px; text-align:center; max-width:400px; line-height:1.5; }
        .gm-caption code { background:#E3E0D3; padding:1px 5px; border-radius:5px; font-size:11px; }
        .gm-frame { position:relative; width:375px; height:760px; border-radius:36px; overflow:hidden; box-shadow:0 30px 60px -20px rgba(20,30,20,0.35), 0 0 0 8px #1B2420; background:#0E1210; }
        .gm-statusbar { position:absolute; top:0; left:0; right:0; height:34px; display:flex; align-items:center; justify-content:space-between; padding:0 20px; font-size:12px; color:#fff; z-index:5; font-weight:600; }
        .gm-map { position:absolute; inset:0; background: radial-gradient(circle at 30% 20%, #4C7A5A 0%, #2F5233 55%, #22391F 100%); }
        .gm-map-you { position:absolute; left:18%; top:50%; width:14px; height:14px; border-radius:50%; background:#4EA3FF; box-shadow:0 0 0 6px rgba(78,163,255,0.3); }
        .gm-map-pin { position:absolute; transform: translate(-50%,-100%); color:#F7F5EF; opacity:0.75; transition: all 200ms ease; }
        .gm-map-pin-active { color:#E8A23D; opacity:1; filter: drop-shadow(0 0 6px rgba(232,162,61,0.8)); }
        .gm-map-mode-badge { position:absolute; top:40px; left:12px; font-size:10px; color:#EFEDE4; background:rgba(0,0,0,0.35); padding:3px 8px; border-radius:20px; }
        .gm-map-route-badge { position:absolute; top:66px; left:12px; font-size:11px; color:#1B2420; background:#E8A23D; padding:4px 10px; border-radius:20px; font-weight:600; }
        .gm-sheet { position:absolute; left:0; right:0; bottom:0; background:#F7F5EF; border-radius:20px 20px 0 0; box-shadow:0 -10px 30px rgba(0,0,0,0.25); display:flex; flex-direction:column; overflow:hidden; touch-action:none; }
        .gm-handle { display:flex; justify-content:center; padding:10px 0 6px; cursor:grab; }
        .gm-handle-bar { width:36px; height:4px; border-radius:3px; background:#C9C4B6; }
        .gm-header { display:flex; align-items:center; gap:10px; padding: 2px 16px 10px; background:#F7F5EF; transition: padding 160ms ease; }
        .gm-header-compact { padding: 0px 16px 6px; }
        .gm-header-compact .gm-header-title { font-size:13.5px; }
        .gm-row-tag-missing { opacity:0.55; }
        .gm-row-badge { font-size:9.5px; font-weight:700; padding:1px 6px; border-radius:8px; margin-left:6px; vertical-align:middle; }
        .gm-row-badge-replacement { background:#FBF0DC; color:#8A5A16; }
        .gm-row-badge-missing { background:#F1E4E4; color:#7A2E2E; }
        .gm-stale-banner { font-size:11.5px; color:#8A5A16; background:#FBF0DC; padding:6px 10px; border-radius:8px; }
        .gm-photo-strip { display:flex; gap:8px; overflow-x:auto; padding-bottom:2px; }
        .gm-photo { flex:0 0 84px; height:84px; border-radius:12px; position:relative; overflow:hidden; }
        .gm-photo-shimmer { position:absolute; inset:0; background:linear-gradient(90deg,#E8E5D9,#F3F1E8,#E8E5D9); background-size:200% 100%; animation: gm-progress-anim 1.2s linear infinite; }
        .gm-header-icon { color:#2F5233; }
        .gm-header-text { display:flex; flex-direction:column; min-width:0; }
        .gm-header-title { font-size:15px; font-weight:700; color:#1B2420; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .gm-header-sub { font-size:12px; color:#7A8277; }
        .gm-icon-btn { border:none; background:#EFEDE4; width:32px; height:32px; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#1B2420; cursor:pointer; flex-shrink:0; }
        .gm-icon-btn-tiny { width:22px; height:22px; }
        .gm-toolbar { padding: 0 16px 10px; }
        .gm-search-input { display:flex; align-items:center; gap:8px; width:100%; background:#EFEDE4; border:none; border-radius:12px; padding:10px 12px; color:#5B6459; font-size:13px; cursor:pointer; box-sizing:border-box; }
        .gm-search-active input { border:none; background:transparent; outline:none; font-size:13px; flex:1; color:#1B2420; }
        .gm-content { flex:1; overflow-y:auto; padding: 4px 16px 8px; display:flex; flex-direction:column; gap:10px; }
        .gm-section-label { font-size:11px; text-transform:uppercase; letter-spacing:.05em; color:#9AA196; margin-top:6px; }
        .gm-list { display:flex; flex-direction:column; gap:6px; }
        .gm-row { display:flex; align-items:center; gap:10px; padding:10px; border:none; background:#fff; border-radius:12px; cursor:pointer; text-align:left; }
        .gm-row-avatar { font-size:18px; }
        .gm-row-body { display:flex; flex-direction:column; flex:1; min-width:0; }
        .gm-row-title { font-size:13.5px; font-weight:600; color:#1B2420; }
        .gm-row-meta { font-size:11.5px; color:#7A8277; }
        .gm-row-price { font-size:13px; font-weight:700; color:#2F5233; }
        .gm-empty { padding: 30px 10px; text-align:center; color:#9AA196; font-size:13px; }
        .gm-hint { font-size:11.5px; color:#9AA196; padding:8px 2px; }
        .gm-progress { display:flex; flex-direction:column; gap:6px; background:#EFEDE4; padding:10px 12px; border-radius:12px; font-size:12px; color:#5B6459; }
        .gm-progress-bar { height:4px; border-radius:3px; background:linear-gradient(90deg,#2F5233,#8FA998,#2F5233); background-size:200% 100%; animation: gm-progress-anim 1.1s linear infinite; }
        @keyframes gm-progress-anim { 0%{background-position:0% 0} 100%{background-position:200% 0} }
        .gm-option-card { display:flex; align-items:center; gap:10px; padding:12px; border-radius:14px; border:2px solid transparent; background:#fff; cursor:pointer; text-align:left; }
        .gm-option-card-active { border-color:#2F5233; background:#EAF1EA; }
        .gm-option-emoji { font-size:20px; }
        .gm-option-body { display:flex; flex-direction:column; flex:1; min-width:0; }
        .gm-option-title { font-size:13.5px; font-weight:700; color:#1B2420; }
        .gm-option-meta { font-size:11px; color:#7A8277; }
        .gm-option-cost { font-size:14px; font-weight:700; color:#2F5233; }
        .gm-seller-meta { font-size:12.5px; color:#7A8277; }
        .gm-coverage { background:#EAF1EA; border-radius:14px; padding:12px 14px; display:flex; flex-direction:column; gap:6px; }
        .gm-coverage-title { font-size:12px; color:#4A6B4F; font-weight:600; }
        .gm-coverage-value { font-size:17px; font-weight:800; color:#1B2420; }
        .gm-coverage-bar { height:6px; border-radius:3px; background:#D6E2D3; overflow:hidden; }
        .gm-coverage-bar-fill { height:100%; background:#2F5233; }
        .gm-alerts { display:flex; flex-direction:column; gap:4px; }
        .gm-alert-row { font-size:12.5px; color:#8A5A16; background:#FBF0DC; padding:6px 10px; border-radius:8px; }
        .gm-collapsible-toggle { border:none; background:none; padding:8px 2px; font-size:12.5px; font-weight:600; color:#2F5233; cursor:pointer; text-align:left; width:100%; }
        .gm-skeleton { display:flex; flex-direction:column; gap:8px; }
        .gm-skeleton-line { height:12px; border-radius:6px; background:linear-gradient(90deg,#E8E5D9,#F3F1E8,#E8E5D9); background-size:200% 100%; animation: gm-progress-anim 1.2s linear infinite; }
        .gm-skeleton-w60 { width:60%; } .gm-skeleton-w90 { width:90%; } .gm-skeleton-w40 { width:40%; } .gm-skeleton-w80 { width:80%; }
        .gm-error { display:flex; flex-direction:column; gap:8px; align-items:flex-start; padding:14px; background:#FBEAEA; border-radius:12px; font-size:13px; color:#7A2E2E; }
        .gm-product-hero { height:120px; border-radius:14px; background:linear-gradient(135deg,#DDE6DA,#B9CBB6); }
        .gm-product-price { font-size:18px; font-weight:800; color:#1B2420; }
        .gm-actions { display:flex; gap:8px; padding: 10px 16px calc(14px + env(safe-area-inset-bottom, 0px)); border-top:1px solid #EAE7DB; flex-wrap:wrap; }
        .gm-btn-primary { flex:1; display:flex; align-items:center; justify-content:center; gap:6px; background:#2F5233; color:#fff; border:none; padding:12px; border-radius:12px; font-size:13.5px; font-weight:700; cursor:pointer; min-width:140px; }
        .gm-btn-primary:disabled { opacity:0.6; cursor:default; }
        .gm-btn-secondary { flex:1; background:#EFEDE4; color:#1B2420; border:none; padding:12px; border-radius:12px; font-size:13.5px; font-weight:600; cursor:pointer; min-width:100px; }
        .gm-btn-ghost { background:none; border:none; color:#7A8277; font-size:12px; text-decoration:underline; cursor:pointer; padding:6px; width:100%; }
      `}</style>
      <Root />
    </MapControllerContext.Provider>
  );
}

/* ============================================================================
 * window.storage — типы для persistent storage API артефактов Claude.
 * ========================================================================== */
declare global {
  interface Window {
    storage: {
      get(key: string, shared?: boolean): Promise<{ key: string; value: string; shared: boolean } | null>;
      set(key: string, value: string, shared?: boolean): Promise<{ key: string; value: string; shared: boolean } | null>;
      delete(key: string, shared?: boolean): Promise<{ key: string; deleted: boolean; shared: boolean } | null>;
      list(prefix?: string, shared?: boolean): Promise<{ keys: string[]; prefix?: string; shared: boolean } | null>;
    };
  }
}
