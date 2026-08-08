import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { ArrowLeft, Search, X, MapPin, Navigation, ShoppingBasket, Heart, Plus, Repeat } from "lucide-react";
import { 
  ProductItem, 
  AvailableAction, 
  SellerCardViewModel, 
  BusinessEvent, 
  MapController 
} from "./types";

/* ============================================================================
 * КАТАЛОГИ ДЕЙСТВИЙ И СОБЫТИЙ (КОНТРАКТЫ ПЛАТФОРМЫ)
 * ========================================================================== */

export const ACTION = {
  OPEN_SEARCH: "OPEN_SEARCH",
  SET_SEARCH_QUERY: "SET_SEARCH_QUERY",
  PICK_PURCHASE: "PICK_PURCHASE",
  SELECT_PURCHASE_OPTION: "SELECT_PURCHASE_OPTION",
  OPEN_SELLER: "OPEN_SELLER",
  OPEN_PRODUCT: "OPEN_PRODUCT",
  ADD_PRODUCT: "ADD_PRODUCT",
  REPLACE_PRODUCT: "REPLACE_PRODUCT",
  START_ROUTE: "START_ROUTE",
  TOGGLE_FAVORITE_SELLER: "TOGGLE_FAVORITE_SELLER",
  BACK: "BACK",
  GO_TO_MAIN: "GO_TO_MAIN",
  SET_SHEET_HEIGHT: "SET_SHEET_HEIGHT",
  TOGGLE_OTHER_PRODUCTS: "TOGGLE_OTHER_PRODUCTS",
  REPORT_MISSING_PRODUCT: "REPORT_MISSING_PRODUCT",
  REPORT_PRICE_CHANGE: "REPORT_PRICE_CHANGE",
  SHARE_SELLER: "SHARE_SELLER",
  RETRY_SELLER_LOAD: "RETRY_SELLER_LOAD",
} as const;

export const EVENT = {
  PURCHASE_CALCULATION_STARTED: "PURCHASE_CALCULATION_STARTED",
  PURCHASE_OPTION_SELECTED: "PURCHASE_OPTION_SELECTED",
  SELLER_OPENED: "SELLER_OPENED",
  ROUTE_STARTED: "ROUTE_STARTED",
  EXPLORATION_RESUMED: "EXPLORATION_RESUMED",
} as const;

interface EventBus {
  emit: (event: BusinessEvent) => void;
  subscribe: (fn: (event: BusinessEvent) => void) => () => void;
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

/* ============================================================================
 * ИНТЕРФЕЙС КАРТЫ И КОНТЕКСТ
 * ========================================================================== */

interface MapState {
  mode: string;
  highlightedSellerIds: string[];
  route: any;
  focusedSellerId: string | null;
}

class MockMapProvider implements MapController {
  public state: MapState = { mode: "overview", highlightedSellerIds: [], route: null, focusedSellerId: null };
  private listeners = new Set<(state: MapState) => void>();

  public subscribe(fn: (state: MapState) => void): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }

  private _emit(): void {
    this.listeners.forEach((fn) => fn(this.state));
  }

  public setMode(mode: string): void {
    this.state = { ...this.state, mode };
    this._emit();
  }

  public highlightSellers(ids: string[]): void {
    this.state = { ...this.state, highlightedSellerIds: ids };
    this._emit();
  }

  public showRoute(route: any): void {
    this.state = { ...this.state, route };
    this._emit();
  }

  public focusSeller(id: string): void {
    this.state = { ...this.state, mode: "seller", focusedSellerId: id, highlightedSellerIds: [id] };
    this._emit();
  }

  public centerOn(coordinates: [number, number]): void {
    // Реализация контракта Platform Core
  }

  public zoomIn(): void {
    // Реализация контракта Platform Core
  }

  public zoomOut(): void {
    // Реализация контракта Platform Core
  }

  public reset(): void {
    this.state = { mode: "overview", highlightedSellerIds: [], route: null, focusedSellerId: null };
    this._emit();
  }
}

const MapControllerContext = createContext<MockMapProvider | null>(null);
const useMapController = () => useContext(MapControllerContext);

function useMapState(controller: MockMapProvider): MapState {
  const [state, setState] = useState<MapState>(controller.state);
  useEffect(() => controller.subscribe(setState), [controller]);
  return state;
}

/* ============================================================================
 * MOCK ДАННЫЕ И ДВИЖОК СИСТЕМЫ
 * ========================================================================== */

interface SellerMock {
  id: string;
  name: string;
  rating: number;
  distance: string;
  pos: { x: number; y: number };
}

const MOCK_SELLERS: SellerMock[] = [
  { id: "s1", name: "Ферма Иван", rating: 4.8, distance: "350 м", pos: { x: 32, y: 38 } },
  { id: "s2", name: "Молочная лавка", rating: 4.6, distance: "700 м", pos: { x: 58, y: 55 } },
  { id: "s3", name: "Пасека Мёд", rating: 4.9, distance: "1.1 км", pos: { x: 74, y: 22 } },
  { id: "s4", name: "Овощная база №3", rating: 4.3, distance: "450 м", pos: { x: 44, y: 72 } },
];

const MOCK_OPTIONS = [
  { id: "o1", emoji: "⭐", label: "Рекомендуемый", cost: 1240, sellerIds: ["s1", "s2", "s3"], missing: 0 },
  { id: "o2", emoji: "❤️", label: "Любимые продавцы", cost: 1390, sellerIds: ["s1", "s3"], missing: 1 },
  { id: "o3", emoji: "💰", label: "Минимальная цена", cost: 1090, sellerIds: ["s1", "s2", "s3", "s4"], missing: 0 },
  { id: "o4", emoji: "🚶", label: "Минимальный маршрут", cost: 1310, sellerIds: ["s1", "s4"], missing: 0 },
];

const MOCK_PRODUCTS: Record<string, ProductItem[]> = {
  s1: [{ id: "p1", name: "Домашняя колбаса", price: 390, imageUrl: "🥕" }, { id: "p2", name: "Фермерские яйца", price: 180, imageUrl: "🥕" }],
  s2: [{ id: "p3", name: "Молоко цельное", price: 120, imageUrl: "🥕" }, { id: "p4", name: "Творог домашний", price: 210, imageUrl: "🥕" }],
  s3: [{ id: "p5", name: "Мёд гречишный", price: 560, imageUrl: "🥕" }],
  s4: [{ id: "p6", name: "Картофель молодой", price: 89, imageUrl: "🥕" }, { id: "p7", name: "Помидоры грунтовые", price: 259, imageUrl: "🥕" }],
};

const MOCK_SELLER_CARD: Record<string, any> = {
  s1: {
    coverage: { have: 18, total: 22, fullyCovered: false },
    alerts: ["Нет свежей редиски", "Есть молодой шпинат"],
    info: "Специализация: овощи, молочка · Пн–Вс 8:00–20:00 · Наличные, карта",
    otherProducts: [{ id: "p8", name: "Зелень пучок", price: 60, imageUrl: "🥕" }],
    reports: [{ id: "r1", title: "Качество отличное", date: "сегодня" }],
  },
  s2: { coverage: { have: 2, total: 2, fullyCovered: true }, alerts: [], info: "Специализация: молочная продукция · Вт–Вс 9:00–18:00", otherProducts: [], reports: [] },
  s3: { coverage: { have: 1, total: 1, fullyCovered: true }, alerts: ["Сегодня скидка на мёд"], info: "Специализация: мёд, продукты пчеловодства · Сб–Вс 10:00–16:00", otherProducts: [{ id: "p9", name: "Прополис", price: 340, imageUrl: "🥕" }], reports: [] },
  s4: { coverage: { have: 0, total: 2, fullyCovered: false }, alerts: [], info: "Специализация: овощи · Пн–Сб 7:00–19:00", otherProducts: [], reports: [{ id: "r2", title: "Сегодня товара не было", date: "вчера" }] },
};

const STORAGE_KEY = "bottomsheet-declarative-state";
const HEIGHTS = { Hidden: 0, Collapsed: 0.24, Half: 0.55, Expanded: 0.9 };
const SNAP_ORDER = ["Collapsed", "Half", "Expanded"] as const;
type SheetHeightMode = keyof typeof HEIGHTS;

interface EngineState {
  stack: Array<{ screen: string; params: Record<string, any> }>;
  height: SheetHeightMode;
  query: string;
  calculating: boolean;
  selectedOptionId: string | null;
  favorites: Set<string>;
  basketCount: number;
  restored: boolean;
  sellerLoad: { sellerId: string; status: "loading" | "error" | "ready" } | null;
  otherExpanded: Set<string>;
  failedOnce: Set<string>;
}

function useGreenMarketEngine(eventBus: EventBus) {
  const [state, setState] = useState<EngineState>({
    stack: [{ screen: "main", params: {} }],
    height: "Collapsed",
    query: "",
    calculating: false,
    selectedOptionId: null,
    favorites: new Set(["s1", "s3"]),
    basketCount: 12,
    restored: false,
    sellerLoad: null,
    otherExpanded: new Set(),
    failedOnce: new Set(),
  });

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

  useEffect(() => {
    // Внутренний механизм Mock-хранилища
    setState((s) => ({ ...s, restored: true }));
  }, []);

  useEffect(() => {
    if (!state.calculating) return;
    const t = setTimeout(() => {
      setState((s) => ({
        ...s,
        calculating: false,
        stack: [...s.stack, { screen: "options", params: {} }],
        height: "Half",
      }));
    }, 1200);
    return () => clearTimeout(t);
  }, [state.calculating]);

  const dispatch = useCallback(
    (action: { type: string; payload?: Record<string, any> }) => {
      const { type, payload = {} } = action;
      setState((s) => {
        const now = Date.now();
        switch (type) {
          case ACTION.OPEN_SEARCH:
            return { ...s, stack: [...s.stack, { screen: "search", params: {} }], height: "Half" };
          case ACTION.SET_SEARCH_QUERY:
            return { ...s, query: payload.query };
          case ACTION.PICK_PURCHASE:
            eventBus.emit({ type: EVENT.PURCHASE_CALCULATION_STARTED, payload: {}, timestamp: now });
            return { ...s, calculating: true };
          case ACTION.SELECT_PURCHASE_OPTION: {
            const opt = MOCK_OPTIONS.find((o) => o.id === payload.optionId);
            if (opt) {
              eventBus.emit({ 
                type: EVENT.PURCHASE_OPTION_SELECTED, 
                payload: { optionId: opt.id, sellerIds: opt.sellerIds, cost: opt.cost }, 
                timestamp: now 
              });
            }
            return { ...s, selectedOptionId: payload.optionId, height: "Half" };
          }
          case ACTION.OPEN_SELLER:
            eventBus.emit({ type: EVENT.SELLER_OPENED, payload: { sellerId: payload.sellerId }, timestamp: now });
            return {
              ...s,
              stack: [...s.stack, { screen: "seller", params: { sellerId: payload.sellerId } }],
              height: "Expanded",
              sellerLoad: { sellerId: payload.sellerId, status: "loading" },
            };
          case ACTION.RETRY_SELLER_LOAD:
            return { ...s, sellerLoad: { sellerId: payload.sellerId, status: "loading" } };
          case ACTION.TOGGLE_OTHER_PRODUCTS: {
            const otherExpanded = new Set(s.otherExpanded);
            otherExpanded.has(payload.sellerId) ? otherExpanded.delete(payload.sellerId) : otherExpanded.add(payload.sellerId);
            return { ...s, otherExpanded };
          }
          case ACTION.OPEN_PRODUCT:
            return { ...s, stack: [...s.stack, { screen: "product", params: payload }], height: "Expanded" };
          case ACTION.START_ROUTE: {
            const currentScreen = s.stack[s.stack.length - 1];
            eventBus.emit({ type: EVENT.ROUTE_STARTED, payload: { sellerId: currentScreen?.params?.sellerId }, timestamp: now });
            return s;
          }
          case ACTION.TOGGLE_FAVORITE_SELLER: {
            const favorites = new Set(s.favorites);
            favorites.has(payload.sellerId) ? favorites.delete(payload.sellerId) : favorites.add(payload.sellerId);
            return { ...s, favorites };
          }
          case ACTION.ADD_PRODUCT:
          case ACTION.REPLACE_PRODUCT:
            return { ...s, basketCount: s.basketCount + (type === ACTION.ADD_PRODUCT ? 1 : 0) };
          case ACTION.BACK:
            return s.stack.length > 1 ? { ...s, stack: s.stack.slice(0, -1) } : s;
          case ACTION.GO_TO_MAIN:
            eventBus.emit({ type: EVENT.EXPLORATION_RESUMED, payload: {}, timestamp: now });
            return { ...s, stack: [{ screen: "main", params: {} }], height: "Collapsed", selectedOptionId: null };
          case ACTION.SET_SHEET_HEIGHT:
            return { ...s, height: payload.height as SheetHeightMode };
          default:
            return s;
        }
      });
    },
    [eventBus]
  );

  return { viewModel: buildViewModel(state), dispatch };
}

/* ============================================================================
 * ДЕКЛАРАТИВНАЯ СБОРКА VIEWMODEL В СООТВЕТСТВИИ С ТЗ-025
 * ========================================================================== */

function buildViewModel(state: EngineState): any {
  const current = state.stack[state.stack.length - 1];
  const showBack = state.stack.length > 1;
  const base: any = { height: state.height, screenId: current.screen, header: null, toolbar: null, content: { blocks: [] }, availableActions: [] };

  if (current.screen === "main") {
    base.header = { title: `Покупка на сегодня, ${state.basketCount} товаров`, subtitle: `${state.basketCount} товаров в корзине`, icon: "basket", showBack };
    base.toolbar = { kind: "search-trigger", placeholder: "Найти продавца или товар", action: { type: ACTION.OPEN_SEARCH } };
    if (state.calculating) base.content.blocks.push({ type: "progress", text: "Считаем оптимальный вариант…" });
    base.content.blocks.push({ type: "sectionLabel", text: "Избранные продавцы рядом" });
    base.content.blocks.push({
      type: "list",
      items: MOCK_SELLERS.filter((s) => state.favorites.has(s.id)).map((s) => sellerRow(s, state.favorites)),
    });
    if (state.selectedOptionId) {
      base.content.blocks.push({ type: "text", text: `Выбран вариант: ${MOCK_OPTIONS.find((o) => o.id === state.selectedOptionId)?.label}` });
    }
    base.availableActions.push({ id: "pick", actionType: ACTION.PICK_PURCHASE, label: state.calculating ? "Подбираем…" : "Подобрать покупку", variant: "primary", disabled: state.calculating });
  }

  if (current.screen === "search") {
    base.header = { title: "Поиск", showBack };
    base.toolbar = {
      kind: "search-input",
      value: state.query,
      onChangeAction: (query: string) => ({ type: ACTION.SET_SEARCH_QUERY, payload: { query } }),
      clearAction: { type: ACTION.SET_SEARCH_QUERY, payload: { query: "" } },
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
      items: MOCK_OPTIONS.map((o) => ({
        id: o.id,
        emoji: o.emoji,
        title: o.label,
        subtitle: `${o.sellerIds.length} продавца · ${o.missing ? `${o.missing} товара нет в наличии` : "всё в наличии"}`,
        trailing: `${o.cost} ₽`,
        highlighted: state.selectedOptionId === o.id,
        action: { type: ACTION.SELECT_PURCHASE_OPTION, payload: { optionId: o.id } },
      })),
    });
    if (state.selectedOptionId) {
      const activeOption = MOCK_OPTIONS.find((o) => o.id === state.selectedOptionId);
      if (activeOption) {
        base.content.blocks.push({ type: "sectionLabel", text: "Продавцы в маршруте" });
        base.content.blocks.push({
          type: "list",
          items: activeOption.sellerIds.map((id) => sellerRow(MOCK_SELLERS.find((s) => s.id === id)!, state.favorites)),
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
    } else if (load === "loading") {
      base.content.blocks.push({ type: "skeleton" });
    } else if (load === "error") {
      base.content.blocks.push({ type: "errorRetry", text: "Не удалось загрузить карточку продавца.", retryAction: { type: ACTION.RETRY_SELLER_LOAD, payload: { sellerId } } });
    } else {
      const basketProducts = MOCK_PRODUCTS[sellerId] || [];
      base.content.blocks.push({ type: "coverage", have: card.coverage.have, total: card.coverage.total, fullyCovered: card.coverage.fullyCovered });
      if (card.alerts.length) base.content.blocks.push({ type: "alerts", items: card.alerts });
      base.content.blocks.push({ type: "text", text: card.info });
      base.content.blocks.push({ type: "sectionLabel", text: "Товары из вашей покупки" });
      if (basketProducts.length === 0) {
        base.content.blocks.push({ type: "empty", text: "У этого продавца нет товаров из вашей текущей покупки." });
      } else {
        base.content.blocks.push({ type: "list", items: basketProducts.map((p) => productRow(sellerId, p)) });
      }
      const expanded = state.otherExpanded.has(sellerId);
      base.content.blocks.push({
        type: "collapsible",
        label: `Остальные товары (${card.otherProducts.length})`,
        expanded,
        toggleAction: { type: ACTION.TOGGLE_OTHER_PRODUCTS, payload: { sellerId } },
        items: expanded ? card.otherProducts.map((p: any) => productRow(sellerId, p)) : [],
      });
      if (card.reports.length) {
        base.content.blocks.push({ type: "sectionLabel", text: "Сообщения покупателей" });
        base.content.blocks.push({ type: "list", items: card.reports.map((r: any) => ({ id: r.id, avatar: "💬", title: r.title, subtitle: r.date, action: null })) });
      }
    }

    base.availableActions.push(
      { id: "route", actionType: ACTION.START_ROUTE, label: "Начать маршрут", icon: "navigation", variant: "primary" },
      { id: "fav", actionType: ACTION.TOGGLE_FAVORITE_SELLER, payload: { sellerId }, label: isFav ? "В избранном" : "Избранное", icon: "heart", variant: "secondary" },
      { id: "report", actionType: ACTION.REPORT_MISSING_PRODUCT, payload: { sellerId }, label: "Сообщить об отсутствии", variant: "ghost" }
    );
  }

  if (current.screen === "product") {
    const product = (MOCK_PRODUCTS[current.params.sellerId] || []).find((p) => p.id === current.params.productId);
    base.header = { title: product?.name ?? "Товар", showBack };
    if (product) {
      base.content.blocks.push({ type: "hero" });
      base.content.blocks.push({ type: "priceLine", text: `${product.price} ₽` });
      base.content.blocks.push({ type: "text", text: "Заглушка карточки товара — контракт зафиксирован." });
    } else {
      base.content.blocks.push({ type: "empty", text: "Товар не найден" });
    }
    base.availableActions.push(
      { id: "add", actionType: ACTION.ADD_PRODUCT, payload: { sellerId: current.params.sellerId, productId: current.params.productId }, label: "Добавить", icon: "plus", variant: "primary" },
      { id: "replace", actionType: ACTION.REPLACE_PRODUCT, payload: { sellerId: current.params.sellerId, productId: current.params.productId }, label: "Заменить", icon: "repeat", variant: "secondary" }
    );
  }

  if (showBack) base.availableActions.push({ id: "go-main", actionType: ACTION.GO_TO_MAIN, label: "На главный", variant: "ghost" });

  return base;
}

function productRow(sellerId: string, product: ProductItem) {
  return {
    id: product.id,
    avatar: product.imageUrl || "🥕",
    title: product.name,
    subtitle: "Единица товара",
    trailing: `${product.price} ₽`,
    action: { type: ACTION.OPEN_PRODUCT, payload: { sellerId, productId: product.id } },
  };
}

function sellerRow(seller: SellerMock, favorites: Set<string>) {
  if (!seller) return null;
  return {
    id: seller.id,
    avatar: favorites.has(seller.id) ? "❤️" : "🏪",
    title: seller.name,
    subtitle: `⭐ ${seller.rating} · ${seller.distance}`,
    action: { type: ACTION.OPEN_SELLER, payload: { sellerId: seller.id } },
  };
}

/* ============================================================================
 * ЧИСТЫЙ ДЕКЛАРАТИВНЫЙ КОМПОНЕНТ РЕНДЕРИНГА UI
 * ========================================================================== */

const ICONS: Record<string, React.ComponentType<any>> = { 
  basket: ShoppingBasket, 
  navigation: Navigation, 
  heart: Heart, 
  plus: Plus, 
  repeat: Repeat 
};

interface BottomSheetProps {
  viewModel: any;
  dispatch: (action: any) => void;
  frameHeight: number;
}

function BottomSheet({ viewModel, dispatch, frameHeight }: BottomSheetProps) {
  const [dragPx, setDragPx] = useState<number | null>(null);
  const dragState = useRef<{ startY: number; startPx: number } | null>(null);

  const officialPercent = HEIGHTS[viewModel.height as SheetHeightMode] ?? 0.24;
  const currentPx = dragPx !== null ? dragPx : officialPercent * frameHeight;

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = { startY: e.clientY, startPx: officialPercent * frameHeight };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragState.current) return;
    const delta = dragState.current.startY - e.clientY;
    const next = Math.min(frameHeight * 0.92, Math.max(frameHeight * 0.12, dragState.current.startPx + delta));
    setDragPx(next);
  };

  const onPointerUp = () => {
    if (dragPx === null) return;
    let nearest: SheetHeightMode = "Collapsed";
    let best = Infinity;
    for (const s of SNAP_ORDER) {
      const d = Math.abs(HEIGHTS[s] * frameHeight - dragPx);
      if (d < best) {
        best = d;
        nearest = s;
      }
    }
    setDragPx(null);
    dragState.current = null;
    dispatch({ type: ACTION.SET_SHEET_HEIGHT, payload: { height: nearest } });
  };

  const HeaderIcon = viewModel.header?.icon ? ICONS[viewModel.header.icon] : null;

  return (
    <div className="gm-sheet" style={{ height: `${currentPx}px`, transition: dragPx !== null ? "none" : "height 260ms cubic-bezier(.2,.8,.2,1)" }}>
      <div className="gm-handle" onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp}>
        <div className="gm-handle-bar" />
      </div>

      {viewModel.header && (
        <div className="gm-header">
          {viewModel.header.showBack ? (
            <button className="gm-icon-btn" onClick={() => dispatch({ type: ACTION.BACK })} aria-label="Назад">
              <ArrowLeft size={18} />
            </button>
          ) : (
            HeaderIcon && <HeaderIcon size={18} className="gm-header-icon" />
          )}
          <div className="gm-header-text">
            <div className="gm-header-title">{viewModel.header.title}</div>
            {viewModel.header.subtitle && <div className="gm-header-sub">{viewModel.header.subtitle}</div>}
          </div>
        </div>
      )}

      {viewModel.toolbar?.kind === "search-trigger" && (
        <div className="gm-toolbar">
          <button className="gm-search-input" onClick={() => dispatch(viewModel.toolbar.action)}>
            <Search size={16} />
            <span>{viewModel.toolbar.placeholder}</span>
          </button>
        </div>
      )}
      {viewModel.toolbar?.kind === "search-input" && (
        <div className="gm-toolbar">
          <div className="gm-search-input gm-search-active">
            <Search size={16} />
            <input autoFocus placeholder="Поиск…" value={viewModel.toolbar.value} onChange={(e) => dispatch(viewModel.toolbar.onChangeAction(e.target.value))} />
            {viewModel.toolbar.value && (
              <button className="gm-icon-btn gm-icon-btn-tiny" onClick={() => dispatch(viewModel.toolbar.clearAction)}>
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      )}

      <div className="gm-content">
        <ContentBlocks blocks={viewModel.content.blocks} dispatch={dispatch} />
      </div>

      {viewModel.availableActions.length > 0 && (
        <div className="gm-actions">
          {viewModel.availableActions.map((a: AvailableAction | any) => {
            const Icon = a.icon ? ICONS[a.icon] : null;
            const cls = a.variant === "primary" ? "gm-btn-primary" : a.variant === "ghost" ? "gm-btn-ghost" : "gm-btn-secondary";
            return (
              <button key={a.id} className={cls} disabled={a.disabled} onClick={() => dispatch({ type: a.actionType, payload: a.payload })}>
                {Icon && <Icon size={15} />} {a.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Row({ item, dispatch }: { item: any; dispatch: (action: any) => void }) {
  return (
    <button className="gm-row" disabled={!item.action} onClick={() => item.action && dispatch(item.action)}>
      <span className="gm-row-avatar">{item.avatar}</span>
      <span className="gm-row-body">
        <span className="gm-row-title">{item.title}</span>
        <span className="gm-row-meta">{item.subtitle}</span>
      </span>
      {item.trailing && <span className="gm-row-price">{item.trailing}</span>}
    </button>
  );
}

function ContentBlocks({ blocks, dispatch }: { blocks: any[]; dispatch: (action: any) => void }) {
  return (
    <>
      {blocks.filter(Boolean).map((b, i) => {
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
            return (
              <div className="gm-list" key={i}>
                {b.items.filter(Boolean).map((item: any) => (
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
                {b.items.map((text: string, idx: number) => <div className="gm-alert-row" key={idx}>{text}</div>)}
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
                    {b.items.map((item: any) => <Row key={item.id} item={item} dispatch={dispatch} />)}
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
                {b.items.map((item: any) => (
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
          case "priceLine":
            return <div className="gm-product-price" key={i}>{b.text}</div>;
          case "hero":
            return <div className="gm-product-hero" key={i} />;
          default:
            return null;
        }
      })}
    </>
  );
}

/* ============================================================================
 * ПРОЕКЦИЯ ДЛЯ КАРТЫ СЛОЯ (СВЯЗЬ ПО EVENT BUS)
 * ========================================================================== */

function useMapProjection(eventBus: EventBus, mapController: MockMapProvider) {
  useEffect(() => {
    return eventBus.subscribe((event) => {
      switch (event.type) {
        case EVENT.PURCHASE_CALCULATION_STARTED:
          mapController.setMode("picking");
          break;
        case EVENT.PURCHASE_OPTION_SELECTED:
          mapController.highlightSellers(event.payload.sellerIds);
          mapController.showRoute({ sellerIds: event.payload.sellerIds, cost: event.payload.cost });
          break;
        case EVENT.SELLER_OPENED:
          mapController.focusSeller(event.payload.sellerId);
          break;
        case EVENT.ROUTE_STARTED:
          mapController.setMode("route");
          break;
        case EVENT.EXPLORATION_RESUMED:
          mapController.reset();
          break;
        default:
          break;
      }
    });
  }, [eventBus, mapController]);
}

function MapLayer() {
  const mapController = useMapController();
  if (!mapController) return null;
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
      <div className="gm-map-mode-badge">mode: {mapState.mode}</div>
    </div>
  );
}

function Root() {
  const mapController = useMapController();
  const eventBusRef = useRef<EventBus | null>(null);
  if (!eventBusRef.current) eventBusRef.current = createEventBus();
  const eventBus = eventBusRef.current;

  if (mapController) {
    useMapProjection(eventBus, mapController);
  }

  const { viewModel, dispatch } = useGreenMarketEngine(eventBus);
  const frameHeight = 760;

  return (
    <div className="gm-root">
      <div className="gm-frame">
        <div className="gm-statusbar"><span>9:41</span><span>●●●</span></div>
        <MapLayer />
        <BottomSheet viewModel={viewModel} dispatch={dispatch} frameHeight={frameHeight} />
      </div>
    </div>
  );
}

export default function App() {
  const controllerRef = useRef(new MockMapProvider());
  return (
    <MapControllerContext.Provider value={controllerRef.current}>
      <Root />
    </MapControllerContext.Provider>
  );
}