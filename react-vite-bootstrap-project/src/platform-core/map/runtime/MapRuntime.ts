import type { SellerId } from "@/platform-core/contracts/Action";
import type { BottomSheetState, GeoPoint, SellerMapRecord, SellerSearchState } from "@/platform-core/map/viewmodels/MapViewModel";
import type { CategoryOption } from "@/platform-core/map/repository/SellerRepository";
import { defaultMapConfig } from "@/platform-core/map/gis/MapConfig";
import { Diagnostics } from "@/platform-core/diagnostics/Diagnostics";
import {
  applySellerFilters,
  buildSellerFilters,
  type SellerFiltersState,
} from "@/platform-core/map/filters/SellerFilters";

/* ============================================================================
 * MapRuntime — IMP-003.1.2 §8: "Runtime становится единственным источником
 * состояния" (выбранный продавец, положение карты, масштаб, состояние
 * Bottom Sheet, результаты поиска, фильтр). React-компоненты только
 * отображают это состояние и вызывают dispatch() — сами его не меняют.
 *
 * Общий GreenMarketRuntime (navigation-runtime-layer) хранит ТОЛЬКО стек
 * навигации (RuntimeState = { navigation }) — это общий контракт для всех
 * 7+1 экранов, расширять его доменным состоянием одного экрана означало бы
 * менять фундамент, от которого зависят остальные модули. MapRuntime — тот
 * же паттерн (getState/dispatch/subscribe), но масштаба одного экрана;
 * навигационные Action (OPEN_SELLER, OPEN_SELLER_LIST, OPEN_CATALOG, BACK)
 * по-прежнему идут через общий Runtime (см. MapScreenView) — MapRuntime не
 * подменяет Action Catalog/ScreenRegistry, а дополняет их доменным слоем,
 * которого не было ни у одного из существующих модулей.
 *
 * Фильтр продавцов — конфигурируемый (см. platform-core/map/filters/
 * SellerFilters.ts): состояние выбора хранится здесь как groupId → optionId[]
 * и ОБЩЕЕ для карты, списка продавцов (см. SellerListScreenView) и мастера
 * «Поиск продавцов». Мастер читает тот же selectedFilters и применяет его к
 * своим результатам — смена фильтра в любом из трёх мест сразу видна в
 * остальных (единая сущность). Новые методы/чекбоксы добавляются в
 * buildSellerFilters без изменения reducer'а и UI.
 *
 * Singleton на уровне модуля — переживает unmount/remount MapScreenView
 * (уход на Catalog/SellerCard и возврат), что и даёт "восстановление
 * состояния карты после возврата на экран" (§10/§12) без отдельного
 * MapSessionStore: теперь один источник, а не два синхronизируемых.
 * ========================================================================== */

/** Радиус поиска продавцов по умолчанию (метры) — стартовое значение мастера
 *  «Поиск продавцов» (MAP-053/MAP-018); пользователь может его изменить. */
export const DEFAULT_SELLER_SEARCH_RADIUS_METERS = 5000;

export interface MapRuntimeState {
  /** Продавцы, прошедшие фильтр (то, что реально рисуется на карте). Ниже в
   *  reducer считается из loadedSellers + selectedFilters. */
  visibleSellers: SellerMapRecord[];
  /** Сырой результат Repository (видимая область, БЕЗ фильтра) — нужен,
   *  чтобы при смене фильтра не перезапрашивать Repository, а пересчитать
   *  видимый список локально. */
  loadedSellers: SellerMapRecord[];
  /** Все категории каталога (источник для опций группы «Категория»). */
  categories: CategoryOption[];
  /** Выбранные опции фильтра: groupId → optionId[]. Группа с пустым набором
   *  не фильтрует (в категориях это «Все»). */
  selectedFilters: SellerFiltersState;
  selectedSellerId: SellerId | null;
  bottomSheet: BottomSheetState;
  /** Мастер «Поиск продавцов» (MAP-053/MAP-018): точка поиска, радиус и
   *  результаты. Активен, когда bottomSheet = sellerSearchOrigin /
   *  sellerSearchResults. rawResults хранит сырой ответ Repository, а results
   *  пересчитывается из него тем же глобальным фильтром, что и visibleSellers
   *  (единая сущность — смена фильтра в любом месте видна во всех). */
  sellerSearch: SellerSearchState;
  mapCenter: GeoPoint;
  zoom: number;
  userLocation: GeoPoint | null;
  searchResult: SellerMapRecord[] | null;
  loading: boolean;
  error: boolean;
  /** Название района/населённого пункта текущего просмотра (GM-UX-001
   *  "Область текущего района"); null — район не определён. */
  currentAreaLabel: string | null;
}

export type MapRuntimeAction =
  | { type: "MAP_LOADED" }
  | { type: "SELLERS_LOADING" }
  | { type: "SELLERS_LOADED"; sellers: SellerMapRecord[] }
  | { type: "SELLERS_LOAD_FAILED" }
  | { type: "MOVE_MAP"; center: GeoPoint; zoom: number }
  | { type: "ZOOM_MAP"; zoom: number }
  | { type: "CENTER_ON_USER_SUCCESS"; location: GeoPoint }
  /* §4: "повторное нажатие по выбранному продавцу" и "выбор другого
   * продавца" — оба обрабатываются одним и тем же SELECT_SELLER: reducer
   * ниже гарантирует, что в любой момент выбран не более чем один продавец,
   * без отдельной ветки под "уже выбран этот же". */
  | { type: "SELECT_SELLER"; sellerId: SellerId }
  | { type: "UNSELECT_SELLER" }
  | { type: "SEARCH_RESULT"; sellers: SellerMapRecord[] }
  | { type: "SEARCH_CLEARED" }
  /* ======== Action'ы мастера «Поиск продавцов» (MAP-053/MAP-018) ========
   *  SELLER_SEARCH_OPEN — открыть мастер (экран выбора точки).
   *  SELLER_SEARCH_ORIGIN_PICKED { origin, label } — выбрана точка поиска;
   *    мастер переходит на экран результатов (поиск запускает компонент).
   *  SELLER_SEARCH_RADIUS_CHANGED { radiusMeters } — пользователь ввёл новый
   *    радиус (перезапрос делает компонент после дебаунса).
   *  SELLER_SEARCH_RESULT { sellers } — Repository вернул сырые результаты
   *    (фильтр применяется в reducer к results).
   *  SELLER_SEARCH_BACK — вернуться с экрана результатов к выбору точки.
   *  ------------------------------------------------------------------- */
  | { type: "SELLER_SEARCH_OPEN" }
  | { type: "SELLER_SEARCH_ORIGIN_PICKED"; origin: GeoPoint; label: string }
  | { type: "SELLER_SEARCH_RADIUS_CHANGED"; radiusMeters: number }
  | { type: "SELLER_SEARCH_RESULT"; sellers: SellerMapRecord[] }
  | { type: "SELLER_SEARCH_BACK" }
  | { type: "AREA_LABEL_UPDATED"; label: string | null }
  | { type: "CATEGORIES_LOADED"; categories: CategoryOption[] }
  /* Универсальная смена фильтра: выбранные опции одной группы (например
   * "category" → [categoryId], "state" → ["open", "available"]). visibleSellers
   * пересчитывается локально из loadedSellers — Repository не дёргается. */
  | { type: "SET_FILTER_OPTIONS"; groupId: string; optionIds: string[] };

const initialState: MapRuntimeState = {
  visibleSellers: [],
  loadedSellers: [],
  categories: [],
  selectedFilters: {},
  selectedSellerId: null,
  bottomSheet: "hidden",
  mapCenter: defaultMapConfig.defaultCenter,
  zoom: defaultMapConfig.defaultZoom,
  userLocation: null,
  searchResult: null,
  sellerSearch: {
    origin: null,
    originLabel: null,
    radiusMeters: DEFAULT_SELLER_SEARCH_RADIUS_METERS,
    rawResults: null,
    results: [],
  },
  loading: false,
  error: false,
  currentAreaLabel: null,
};

/** Выбранный продавец, отфильтрованный из видимого списка, снимается (и
 *  закрывается Bottom Sheet), чтобы не висела пустая карточка. */
function withVisibleSellers(state: MapRuntimeState, visibleSellers: SellerMapRecord[]): MapRuntimeState {
  const selectedStillVisible =
    state.selectedSellerId !== null && visibleSellers.some((s) => s.sellerId === state.selectedSellerId);
  return {
    ...state,
    visibleSellers,
    selectedSellerId: selectedStillVisible ? state.selectedSellerId : null,
    bottomSheet: selectedStillVisible ? state.bottomSheet : "hidden",
  };
}

/** Пересчитывает видимые результаты «Поиска продавцов» из rawResults по
 *  текущему глобальному фильтру. Вызывается и при SELLER_SEARCH_RESULT, и при
 *  SET_FILTER_OPTIONS/CATEGORIES_LOADED — фильтр единая сущность для карты,
 *  списка продавцов и результатов поиска. */
function withSearchResults(state: MapRuntimeState): MapRuntimeState {
  return {
    ...state,
    sellerSearch: {
      ...state.sellerSearch,
      results: applySellerFilters(
        state.sellerSearch.rawResults ?? [],
        buildSellerFilters(state.categories),
        state.selectedFilters,
      ),
    },
  };
}

function reducer(state: MapRuntimeState, action: MapRuntimeAction): MapRuntimeState {
  switch (action.type) {
    case "MAP_LOADED":
      return state;
    case "SELLERS_LOADING":
      return { ...state, loading: true, error: false };
    case "SELLERS_LOADED":
      return withVisibleSellers(
        { ...state, loading: false, error: false, loadedSellers: action.sellers },
        applySellerFilters(action.sellers, buildSellerFilters(state.categories), state.selectedFilters),
      );
    case "SELLERS_LOAD_FAILED":
      return { ...state, loading: false, error: false };
    case "CATEGORIES_LOADED": {
      const next = { ...state, categories: action.categories };
      // Категории — источник опций группы «Категория»: после их загрузки
      // пересчитываем видимый список и результаты поиска (фильтр единая
      // сущность), чтобы выбор по id применился к данным.
      return withSearchResults(
        withVisibleSellers(next, applySellerFilters(next.loadedSellers, buildSellerFilters(action.categories), next.selectedFilters)),
      );
    }
    case "SET_FILTER_OPTIONS": {
      const selectedFilters = { ...state.selectedFilters, [action.groupId]: action.optionIds };
      return withSearchResults(
        withVisibleSellers(
          { ...state, selectedFilters },
          applySellerFilters(state.loadedSellers, buildSellerFilters(state.categories), selectedFilters),
        ),
      );
    }
    case "MOVE_MAP":
      return { ...state, mapCenter: action.center, zoom: action.zoom };
    case "ZOOM_MAP":
      return { ...state, zoom: action.zoom };
    case "CENTER_ON_USER_SUCCESS":
      return { ...state, userLocation: action.location, mapCenter: action.location };
    case "SELECT_SELLER":
      // sellerSearch сохраняется: карточка продавца из результатов поиска
      // может подтягивать данные, даже если продавец вне видимой области.
      return { ...state, selectedSellerId: action.sellerId, bottomSheet: "sellerSummary" };
    case "UNSELECT_SELLER":
      // Закрытие карточки/листа сбрасывает и мастер поиска — при повторном
      // открытии он начинается заново с выбора точки.
      return { ...state, selectedSellerId: null, bottomSheet: "hidden", sellerSearch: initialState.sellerSearch };
    case "SEARCH_RESULT":
      return { ...state, searchResult: action.sellers };
    case "SEARCH_CLEARED":
      return { ...state, searchResult: null };
    case "SELLER_SEARCH_OPEN":
      // Открытие мастера: сбрасываем старый мастер и выбор продавца, показываем
      // шаг выбора точки (список «Моё местоположение» / «Положение на карте»).
      return { ...state, selectedSellerId: null, bottomSheet: "sellerSearchOrigin", sellerSearch: initialState.sellerSearch };
    case "SELLER_SEARCH_ORIGIN_PICKED":
      // Точка выбрана: мастер переходит к шагу результатов. Радиус/введённые
      // значения сохраняются, старые результаты (для другой точки) очищаются —
      // перезапрос запускает компонент (rawResults = null → скелетон).
      return {
        ...state,
        selectedSellerId: null,
        bottomSheet: "sellerSearchResults",
        sellerSearch: {
          ...state.sellerSearch,
          origin: action.origin,
          originLabel: action.label,
          rawResults: null,
          results: [],
        },
      };
    case "SELLER_SEARCH_RADIUS_CHANGED":
      // Новый радиус: меняем радиус мгновенно; результаты перезапросит
      // компонент после дебаунса (SELLER_SEARCH_RESULT).
      return { ...state, sellerSearch: { ...state.sellerSearch, radiusMeters: action.radiusMeters } };
    case "SELLER_SEARCH_RESULT":
      // Сырые результаты от Repository; фильтр применяется к results ниже.
      return withSearchResults({ ...state, sellerSearch: { ...state.sellerSearch, rawResults: action.sellers } });
    case "SELLER_SEARCH_BACK":
      // Возврат с экрана результатов к выбору точки: мастер остаётся открытым.
      return { ...state, selectedSellerId: null, bottomSheet: "sellerSearchOrigin" };
    case "AREA_LABEL_UPDATED":
      return { ...state, currentAreaLabel: action.label };
    default:
      return state;
  }
}

/* §14: диагностические события — карта загружена / масштаб / положение /
 * выбор продавца / открытие и закрытие Bottom Sheet / поиск / фильтр.
 * Переход в карточку продавца логируется в MapScreenView (это уже действие
 * Action Catalog, не внутреннее состояние MapRuntime). */
function diagnosticsFor(action: MapRuntimeAction): void {
  switch (action.type) {
    case "MAP_LOADED":
      Diagnostics.track("map.loaded");
      return;
    case "ZOOM_MAP":
      Diagnostics.track("map.zoom_changed", { zoom: action.zoom });
      return;
    case "MOVE_MAP":
      Diagnostics.track("map.moved", { center: action.center, zoom: action.zoom });
      return;
    case "SELECT_SELLER":
      Diagnostics.track("map.seller_selected", { sellerId: action.sellerId });
      Diagnostics.track("map.bottom_sheet_opened", { sellerId: action.sellerId });
      return;
    case "UNSELECT_SELLER":
      Diagnostics.track("map.bottom_sheet_closed");
      return;
    case "SEARCH_RESULT":
      Diagnostics.track("map.search_performed", { resultCount: action.sellers.length });
      return;
    case "SELLER_SEARCH_OPEN":
      Diagnostics.track("map.seller_search_opened");
      return;
    case "SELLER_SEARCH_ORIGIN_PICKED":
      Diagnostics.track("map.seller_search_origin_picked", { label: action.label });
      return;
    case "SELLER_SEARCH_RADIUS_CHANGED":
      Diagnostics.track("map.seller_search_radius_picked", { radiusMeters: action.radiusMeters });
      return;
    case "SELLER_SEARCH_RESULT":
      Diagnostics.track("map.seller_search_results_shown", { resultCount: action.sellers.length });
      return;
    case "SELLER_SEARCH_BACK":
      Diagnostics.track("map.seller_search_back");
      return;
    case "CATEGORIES_LOADED":
      Diagnostics.track("map.categories_loaded", { categoryCount: action.categories.length });
      return;
    case "SET_FILTER_OPTIONS":
      Diagnostics.track("map.filter_changed", { groupId: action.groupId, selectedCount: action.optionIds.length });
      return;
    default:
      return;
  }
}

function createMapRuntime() {
  let state = initialState;
  const listeners = new Set<() => void>();

  return {
    getState: (): MapRuntimeState => state,
    dispatch(action: MapRuntimeAction): void {
      state = reducer(state, action);
      diagnosticsFor(action);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

/** Один экземпляр на вкладку — см. комментарий в шапке файла. */
export const MapRuntime = createMapRuntime();
