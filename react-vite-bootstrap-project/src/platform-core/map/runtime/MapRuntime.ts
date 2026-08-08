import type { SellerId } from "@/platform-core/contracts/Action";
import type { GeoPoint, SellerMapRecord } from "@/platform-core/map/viewmodels/MapViewModel";
import { defaultMapConfig } from "@/platform-core/map/gis/MapConfig";
import { Diagnostics } from "@/platform-core/diagnostics/Diagnostics";

/* ============================================================================
 * MapRuntime — IMP-003.1.2 §8: "Runtime становится единственным источником
 * состояния" (выбранный продавец, положение карты, масштаб, состояние
 * Bottom Sheet, результаты поиска). React-компоненты только отображают это
 * состояние и вызывают dispatch() — сами его не меняют.
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
 * Singleton на уровне модуля — переживает unmount/remount MapScreenView
 * (уход на Catalog/SellerCard и возврат), что и даёт "восстановление
 * состояния карты после возврата на экран" (§10/§12) без отдельного
 * MapSessionStore: теперь один источник, а не два синхronизируемых.
 * ========================================================================== */

export interface MapRuntimeState {
  visibleSellers: SellerMapRecord[];
  selectedSellerId: SellerId | null;
  bottomSheet: "hidden" | "sellerSummary";
  mapCenter: GeoPoint;
  zoom: number;
  userLocation: GeoPoint | null;
  searchResult: SellerMapRecord[] | null;
  loading: boolean;
  error: boolean;
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
  | { type: "SEARCH_CLEARED" };

const initialState: MapRuntimeState = {
  visibleSellers: [],
  selectedSellerId: null,
  bottomSheet: "hidden",
  mapCenter: defaultMapConfig.defaultCenter,
  zoom: defaultMapConfig.defaultZoom,
  userLocation: null,
  searchResult: null,
  loading: false,
  error: false,
};

function reducer(state: MapRuntimeState, action: MapRuntimeAction): MapRuntimeState {
  switch (action.type) {
    case "MAP_LOADED":
      return state;
    case "SELLERS_LOADING":
      return { ...state, loading: true, error: false };
    case "SELLERS_LOADED":
      return { ...state, loading: false, error: false, visibleSellers: action.sellers };
    case "SELLERS_LOAD_FAILED":
      return { ...state, loading: false, error: true };
    case "MOVE_MAP":
      return { ...state, mapCenter: action.center, zoom: action.zoom };
    case "ZOOM_MAP":
      return { ...state, zoom: action.zoom };
    case "CENTER_ON_USER_SUCCESS":
      return { ...state, userLocation: action.location, mapCenter: action.location, zoom: 15 };
    case "SELECT_SELLER":
      return { ...state, selectedSellerId: action.sellerId, bottomSheet: "sellerSummary" };
    case "UNSELECT_SELLER":
      return { ...state, selectedSellerId: null, bottomSheet: "hidden" };
    case "SEARCH_RESULT":
      return { ...state, searchResult: action.sellers };
    case "SEARCH_CLEARED":
      return { ...state, searchResult: null };
    default:
      return state;
  }
}

/* §14: диагностические события — карта загружена / масштаб / положение /
 * выбор продавца / открытие и закрытие Bottom Sheet / поиск. Переход в
 * карточку продавца логируется в MapScreenView (это уже действие Action
 * Catalog, не внутреннее состояние MapRuntime). */
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
