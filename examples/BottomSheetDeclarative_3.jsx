import { useState, useEffect, useRef, useCallback, createContext, useContext } from "react";
import { ArrowLeft, Search, X, MapPin, Navigation, ShoppingBasket, Heart, Plus, Repeat } from "lucide-react";

/* ============================================================================
 * ГРАНИЦА АРХИТЕКТУРЫ (по запросу клиента)
 *
 * Bottom Sheet ничего не решает. Он получает три вещи:
 *   - viewModel        — что показать (Header/Toolbar/Content/Actions), уже готово
 *   - availableActions — какие кнопки/пункты доступны прямо сейчас
 *   - dispatch(action)  — единственный способ сообщить о намерении пользователя
 *
 * Вся бизнес-логика (какая кнопка должна появиться, когда пересчитать
 * покупку, какого продавца подсветить на карте, как достроить маршрут)
 * живёт в GreenMarketEngine ниже. Сейчас движок — mock (стоит вместо
 * Platform Core + Backend + будущего FSM Engine). Когда появится реальный
 * бэкенд, замене подлежит только движок — Bottom Sheet и его дочерние
 * компоненты рендеринга трогать не придётся.
 * ========================================================================== */

/* ------------------------------ Action Catalog ---------------------------- */
/* Action = намерение пользователя, летит ОТ Bottom Sheet К движку. */
const ACTION = {
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
};

/* ------------------------------ Event Catalog ------------------------------ */
/* Business Event = свершившийся факт предметной области, летит ОТ движка
   наружу. Engine не знает, кто на события подписан — сегодня это MapProjection,
   завтра могут быть аналитика, уведомления и т.д. Отдельный каталог от Action
   Catalog — намеренно, по аналогии с разделением Action/Event в ТЗ-017/ТЗ-018. */
const EVENT = {
  PURCHASE_CALCULATION_STARTED: "PURCHASE_CALCULATION_STARTED",
  PURCHASE_OPTION_SELECTED: "PURCHASE_OPTION_SELECTED",
  SELLER_OPENED: "SELLER_OPENED",
  ROUTE_STARTED: "ROUTE_STARTED",
  EXPLORATION_RESUMED: "EXPLORATION_RESUMED",
};

function createEventBus() {
  const listeners = new Set();
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
 * MapController — абстрактный интерфейс карты (не изменился с прошлого шага).
 * Важно: теперь его вызывает ТОЛЬКО движок (GreenMarketEngine), Bottom Sheet
 * о существовании карты вообще не знает.
 * ========================================================================== */
class MockMapProvider {
  constructor() {
    this.state = { mode: "overview", highlightedSellerIds: [], route: null, focusedSellerId: null };
    this.listeners = new Set();
  }
  subscribe(fn) {
    this.listeners.add(fn);
    fn(this.state);
    return () => this.listeners.delete(fn);
  }
  _emit() {
    this.listeners.forEach((fn) => fn(this.state));
  }
  setMode(mode) {
    this.state = { ...this.state, mode };
    this._emit();
  }
  highlightSellers(ids) {
    this.state = { ...this.state, highlightedSellerIds: ids };
    this._emit();
  }
  showRoute(route) {
    this.state = { ...this.state, route };
    this._emit();
  }
  focusSeller(id) {
    this.state = { ...this.state, mode: "seller", focusedSellerId: id, highlightedSellerIds: [id] };
    this._emit();
  }
  reset() {
    this.state = { mode: "overview", highlightedSellerIds: [], route: null, focusedSellerId: null };
    this._emit();
  }
}

const MapControllerContext = createContext(null);
const useMapController = () => useContext(MapControllerContext);
function useMapState(controller) {
  const [state, setState] = useState(controller.state);
  useEffect(() => controller.subscribe(setState), [controller]);
  return state;
}

/* ------------------------------- Mock-данные ------------------------------ */
const MOCK_SELLERS = [
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
const MOCK_PRODUCTS = {
  s1: [{ id: "p1", name: "Домашняя колбаса", price: 390, unit: "400 г" }, { id: "p2", name: "Фермерские яйца", price: 180, unit: "10 шт" }],
  s2: [{ id: "p3", name: "Молоко цельное", price: 120, unit: "1 л" }, { id: "p4", name: "Творог домашний", price: 210, unit: "300 г" }],
  s3: [{ id: "p5", name: "Мёд гречишный", price: 560, unit: "500 г" }],
  s4: [{ id: "p6", name: "Картофель молодой", price: 89, unit: "1 кг" }, { id: "p7", name: "Помидоры грунтовые", price: 259, unit: "1 кг" }],
};

/* Mock SellerCardViewModel-источник (ТЗ-025 п.12) — заменяется Backend-ответом,
   структура блоков карточки от этого не меняется. */
const MOCK_SELLER_CARD = {
  s1: {
    coverage: { have: 18, total: 22, fullyCovered: false },
    alerts: ["Нет свежей редиски", "Есть молодой шпинат"],
    info: "Специализация: овощи, молочка · Пн–Вс 8:00–20:00 · Наличные, карта",
    otherProducts: [{ id: "p8", name: "Зелень пучок", price: 60, unit: "1 пучок" }],
    reports: [{ id: "r1", title: "Качество отличное", date: "сегодня" }],
  },
  s2: { coverage: { have: 2, total: 2, fullyCovered: true }, alerts: [], info: "Специализация: молочная продукция · Вт–Вс 9:00–18:00", otherProducts: [], reports: [] },
  s3: { coverage: { have: 1, total: 1, fullyCovered: true }, alerts: ["Сегодня скидка на мёд"], info: "Специализация: мёд, продукты пчеловодства · Сб–Вс 10:00–16:00", otherProducts: [{ id: "p9", name: "Прополис", price: 340, unit: "50 г" }], reports: [] },
  s4: { coverage: { have: 0, total: 2, fullyCovered: false }, alerts: [], info: "Специализация: овощи · Пн–Сб 7:00–19:00", otherProducts: [], reports: [{ id: "r2", title: "Сегодня товара не было", date: "вчера" }] },
};

const STORAGE_KEY = "bottomsheet-declarative-state";
const HEIGHTS = { Hidden: 0, Collapsed: 0.24, Half: 0.55, Expanded: 0.9 };
const SNAP_ORDER = ["Collapsed", "Half", "Expanded"];

/* ============================================================================
 * GreenMarketEngine — mock-заместитель Platform Core + Backend (+ будущий
 * FSM Engine). Единственное место, которое:
 *   - хранит "настоящее" состояние (стек, высота, корзина, избранное…),
 *   - решает, какие action доступны и что показать (buildViewModel),
 *   - вызывает MapController,
 *   - обрабатывает dispatch(action) и меняет состояние.
 * Замена на реальный Backend/FSM Engine = замена этого хука. Контракт наружу
 * (viewModel + dispatch) не меняется.
 * ========================================================================== */
function useGreenMarketEngine(eventBus) {
  const [state, setState] = useState({
    stack: [{ screen: "main", params: {} }],
    height: "Collapsed",
    query: "",
    calculating: false,
    selectedOptionId: null,
    favorites: new Set(["s1", "s3"]),
    basketCount: 12,
    restored: false,
    sellerLoad: null, // { sellerId, status: 'loading'|'error'|'ready' } — имитирует ответ Backend для карточки продавца
    otherExpanded: new Set(),
    failedOnce: new Set(),
  });

  // имитация загрузки карточки продавца (skeleton/error/ready) — тоже забота движка, не UI
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

  // восстановление состояния (ТЗ-024 п.16) — тоже вне зоны ответственности UI
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY, false);
        if (res?.value) {
          const saved = JSON.parse(res.value);
          setState((s) => ({
            ...s,
            stack: saved.stack?.length ? saved.stack : s.stack,
            height: saved.height || s.height,
          }));
        }
      } catch (e) {
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

  // асинхронный "расчёт" — в реальной системе это ответ Backend/Purchase Optimizer
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
    (action) => {
      const { type, payload = {} } = action;
      setState((s) => {
        switch (type) {
          case ACTION.OPEN_SEARCH:
            return { ...s, stack: [...s.stack, { screen: "search", params: {} }], height: "Half" };
          case ACTION.SET_SEARCH_QUERY:
            return { ...s, query: payload.query };
          case ACTION.PICK_PURCHASE:
            eventBus.emit({ type: EVENT.PURCHASE_CALCULATION_STARTED, payload: {} });
            return { ...s, calculating: true };
          case ACTION.SELECT_PURCHASE_OPTION: {
            const opt = MOCK_OPTIONS.find((o) => o.id === payload.optionId);
            eventBus.emit({ type: EVENT.PURCHASE_OPTION_SELECTED, payload: { optionId: opt.id, sellerIds: opt.sellerIds, cost: opt.cost } });
            return { ...s, selectedOptionId: payload.optionId, height: "Half" };
          }
          case ACTION.OPEN_SELLER:
            eventBus.emit({ type: EVENT.SELLER_OPENED, payload: { sellerId: payload.sellerId } });
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
          case ACTION.REPORT_MISSING_PRODUCT:
          case ACTION.REPORT_PRICE_CHANGE:
          case ACTION.SHARE_SELLER:
            return s; // заглушка: реальная отправка — задача Backend, не Bottom Sheet
          case ACTION.OPEN_PRODUCT:
            return { ...s, stack: [...s.stack, { screen: "product", params: payload }], height: "Expanded" };
          case ACTION.START_ROUTE:
            eventBus.emit({ type: EVENT.ROUTE_STARTED, payload: { sellerId: s.stack[s.stack.length - 1]?.params?.sellerId } });
            return s;
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
            eventBus.emit({ type: EVENT.EXPLORATION_RESUMED, payload: {} });
            return { ...s, stack: [{ screen: "main", params: {} }], height: "Collapsed", selectedOptionId: null };
          case ACTION.SET_SHEET_HEIGHT:
            return { ...s, height: payload.height };
          default:
            return s;
        }
      });
    },
    [eventBus]
  );

  return { viewModel: buildViewModel(state), dispatch };
}

/* ------------------------- сборка ViewModel (декларативно) ------------------------- */
function buildViewModel(state) {
  const current = state.stack[state.stack.length - 1];
  const showBack = state.stack.length > 1;
  const base = { height: state.height, screenId: current.screen, header: null, toolbar: null, content: { blocks: [] }, availableActions: [] };

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
      onChangeAction: (query) => ({ type: ACTION.SET_SEARCH_QUERY, payload: { query } }),
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
      base.content.blocks.push({ type: "sectionLabel", text: "Продавцы в маршруте" });
      base.content.blocks.push({
        type: "list",
        items: MOCK_OPTIONS.find((o) => o.id === state.selectedOptionId).sellerIds.map((id) => sellerRow(MOCK_SELLERS.find((s) => s.id === id), state.favorites)),
      });
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
        items: expanded ? card.otherProducts.map((p) => productRow(sellerId, p)) : [],
      });
      if (card.reports.length) {
        base.content.blocks.push({ type: "sectionLabel", text: "Сообщения покупателей" });
        base.content.blocks.push({ type: "list", items: card.reports.map((r) => ({ id: r.id, avatar: "💬", title: r.title, subtitle: r.date, action: null })) });
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
      base.content.blocks.push({ type: "priceLine", text: `${product.price} ₽ / ${product.unit}` });
      base.content.blocks.push({ type: "text", text: "Заглушка карточки товара — отдельного ТЗ-004 в архиве нет, поля ориентировочные." });
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

function productRow(sellerId, product) {
  return {
    id: product.id,
    avatar: "🥕",
    title: product.name,
    subtitle: product.unit,
    trailing: `${product.price} ₽`,
    action: { type: ACTION.OPEN_PRODUCT, payload: { sellerId, productId: product.id } },
  };
}

function sellerRow(seller, favorites) {
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
 * Bottom Sheet — ЧИСТО ДЕКЛАРАТИВНЫЙ РЕНДЕРЕР.
 * Ниже нет ни одного упоминания "продавца", "товара", "варианта покупки"
 * как бизнес-понятий, ни одного обращения к MapController. Только:
 * viewModel → разметка, клик/жест → dispatch(action).
 * Физика жеста (перевод пикселей в один из 4 уровней) — общий UI-механизм
 * bottom-sheet компонента, а не бизнес-решение: итоговый уровень всё равно
 * подтверждается через dispatch(SET_SHEET_HEIGHT) и приходит обратно в
 * viewModel.height как источник истины.
 * ========================================================================== */
const ICONS = { basket: ShoppingBasket, navigation: Navigation, heart: Heart, plus: Plus, repeat: Repeat };

function BottomSheet({ viewModel, dispatch, frameHeight }) {
  const [dragPx, setDragPx] = useState(null);
  const dragState = useRef(null);

  const officialPercent = HEIGHTS[viewModel.height];
  const currentPx = dragPx !== null ? dragPx : officialPercent * frameHeight;

  const onPointerDown = (e) => {
    dragState.current = { startY: e.clientY, startPx: officialPercent * frameHeight };
    e.target.setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e) => {
    if (!dragState.current) return;
    const delta = dragState.current.startY - e.clientY;
    const next = Math.min(frameHeight * 0.92, Math.max(frameHeight * 0.12, dragState.current.startPx + delta));
    setDragPx(next);
  };
  const onPointerUp = () => {
    if (dragPx === null) return;
    let nearest = SNAP_ORDER[0];
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
          {viewModel.availableActions.map((a) => {
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

function Row({ item, dispatch }) {
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

/* generic-рендер типов блоков контента — Bottom Sheet знает только эти
   примитивы разметки, не их предметный смысл */
function ContentBlocks({ blocks, dispatch }) {
  return blocks.filter(Boolean).map((b, i) => {
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
            {b.items.filter(Boolean).map((item) => (
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
      case "metaLine":
        return <div className="gm-seller-meta" key={i}>{b.text}</div>;
      case "priceLine":
        return <div className="gm-product-price" key={i}>{b.text}</div>;
      case "hero":
        return <div className="gm-product-hero" key={i} />;
      default:
        return null;
    }
  });
}

/* ============================================================================
 * MapProjection — карта как проекция состояния системы.
 * Единственный слой, который переводит Business Events в вызовы MapController.
 * GreenMarketEngine эмитит события и понятия не имеет о существовании карты;
 * MapProjection эмитируемых Action-ов не видит и не участвует в бизнес-логике —
 * он только реагирует на уже свершившиеся факты. Замена карты (после ТЗ-025)
 * или замена движка (после подключения реального Backend/FSM Engine) не
 * требует правок в соседнем слое — их единственная связь — Event Catalog.
 * ========================================================================== */
function useMapProjection(eventBus, mapController) {
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
  const eventBusRef = useRef(null);
  if (!eventBusRef.current) eventBusRef.current = createEventBus();
  const eventBus = eventBusRef.current;

  useMapProjection(eventBus, mapController); // карта — проекция, подписана на события

  const { viewModel, dispatch } = useGreenMarketEngine(eventBus); // движок — только предметная область
  const frameHeight = 760;

  return (
    <div className="gm-root">
      <div className="gm-frame">
        <div className="gm-statusbar"><span>9:41</span><span>●●●</span></div>
        <MapLayer />
        <BottomSheet viewModel={viewModel} dispatch={dispatch} frameHeight={frameHeight} />
      </div>
      <div className="gm-caption">
        Три независимых слоя: <b>Bottom Sheet</b> рендерит только <code>viewModel</code> и шлёт{" "}
        <code>dispatch(action)</code>. <b>GreenMarketEngine</b> знает только предметную область и эмитит{" "}
        <code>Business Events</code>. <b>MapProjection</b> слушает эти события и обновляет карту — движок о карте
        не знает вообще. Карта — обычная проекция состояния системы, а не участник бизнес-логики.
      </div>
    </div>
  );
}

export default function App() {
  const controllerRef = useRef(new MockMapProvider());
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
        .gm-header { display:flex; align-items:center; gap:10px; padding: 2px 16px 10px; }
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
