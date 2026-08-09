import type { SellerId } from "@/platform-core/contracts/Action";
import type { BottomSheetState, GeoPoint, MapBounds, SellerMapRecord, SellerSearchState } from "@/platform-core/map/viewmodels/MapViewModel";
import type { CategoryOption } from "@/platform-core/map/repository/SellerRepository";
import { defaultMapConfig } from "@/platform-core/map/gis/MapConfig";
import { GeoService } from "@/platform-core/map/gis/GeoService";
import { MockSellerRepository } from "@/platform-core/map/repository/MockSellerRepository";
import { Diagnostics } from "@/platform-core/diagnostics/Diagnostics";
import {
  applySellerFilters,
  buildSellerFilters,
  type SellerFilterGroup,
  type SellerFiltersState,
} from "@/platform-core/map/filters/SellerFilters";

/* ============================================================================
 * MapRuntime — IMP-003.1.2 §8: "Runtime становится единственным источником
 * состояния" (выбранный продавец, положение карты, масштаб, состояние
 * Bottom Sheet, результаты поиска, фильтр). React-компоненты только
 * отображают это состояние и вызывают dispatch() — сами его не меняют.
 * Асинхронные потоки с debounce (загрузка продавцов, геокодирование,
 * поиск/радиус мастера) тоже запускаются методами runtime (request*),
 * а не компонентами, — см. низ этого файла.
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

/* Дебаунс асинхронных запросов runtime (методы request* ниже): запрос к
 * Repository/геокодированию запускается после паузы в событиях (moveend/zoomend,
 * ввод радиуса), а не на каждый кадр/символ (MAP-011, MAP-053/MAP-018). */
const VISIBLE_SELLERS_DEBOUNCE_MS = 500;
const AREA_LABEL_DEBOUNCE_MS = 500;
const SELLER_SEARCH_DEBOUNCE_MS = 500;

function boundsNearlyEqual(a: MapBounds, b: MapBounds): boolean {
  return (
    Math.abs(a.north - b.north) < 0.0001 &&
    Math.abs(a.south - b.south) < 0.0001 &&
    Math.abs(a.east - b.east) < 0.0001 &&
    Math.abs(a.west - b.west) < 0.0001
  );
}

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

/** Убирает из selectedFilters опции, которых больше нет в конфиге фильтра
 *  (например, выбранная категория исчезла из каталога после CATEGORIES_LOADED).
 *  Возвращает исходный объект, если менять нечего — чтобы не плодить новые
 *  ссылки и лишние перерисовки. */
function pruneSelectedFilters(
  selectedFilters: SellerFiltersState,
  groups: SellerFilterGroup[],
): SellerFiltersState {
  let changed = false;
  const pruned: SellerFiltersState = {};
  for (const group of groups) {
    const optionIds = group.options.map((o) => o.id);
    const kept = (selectedFilters[group.id] ?? []).filter((id) => optionIds.includes(id));
    if (kept.length !== (selectedFilters[group.id] ?? []).length) changed = true;
    if (kept.length > 0) pruned[group.id] = kept;
  }
  return changed ? pruned : selectedFilters;
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
      // Категории — источник опций группы «Категория». Если какая-то
      // выбранная категория исчезла из нового каталога, её id в selectedFilters
      // становится «мёртвым»: фильтрация его уже игнорирует, но сводка на
      // кнопке и чекбокс «Все» показывали бы рассинхрон. Поэтому чистим выбор
      // по свежему конфигу, затем пересчитываем видимый список и результаты
      // поиска (фильтр единая сущность).
      const groups = buildSellerFilters(action.categories);
      const selectedFilters = pruneSelectedFilters(state.selectedFilters, groups);
      const next = { ...state, categories: action.categories, selectedFilters };
      return withSearchResults(
        withVisibleSellers(next, applySellerFilters(next.loadedSellers, groups, selectedFilters)),
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

  function dispatch(action: MapRuntimeAction): void {
    state = reducer(state, action);
    diagnosticsFor(action);
    listeners.forEach((listener) => listener());
  }

  /* Асинхронные потоки экрана живут в runtime, а не в React-компонентах
   * (IMP-003.1.2 §8): компоненты только диспатчат и отображают состояние.
   * Таймеры и seq-счётчики принадлежат runtime (singleton переживает
   * unmount/remount экрана) — защита от гонок состояний: ответ устаревшего
   * запроса, перекрытого новым, не применяется. setTimeout вместо window —
   * чтобы те же методы работали и под npx tsx (Node, без DOM). */
  let visibleSellersTimer: ReturnType<typeof setTimeout> | null = null;
  let visibleSellersSeq = 0;
  let lastRequestedBounds: MapBounds | null = null;
  let areaLabelTimer: ReturnType<typeof setTimeout> | null = null;
  let areaLabelSeq = 0;
  let sellerSearchTimer: ReturnType<typeof setTimeout> | null = null;
  let sellerSearchSeq = 0;

  /** Фактическая загрузка продавцов (MAP-011): запрос Repository и применение
   *  ответа только если загрузка всё ещё последняя. */
  function loadVisibleSellersNow(bounds: MapBounds): void {
    const seq = ++visibleSellersSeq;
    dispatch({ type: "SELLERS_LOADING" });
    void MockSellerRepository.getVisibleSellers(bounds)
      .then((visible) => {
        if (seq === visibleSellersSeq) dispatch({ type: "SELLERS_LOADED", sellers: visible });
      })
      .catch(() => {
        if (seq === visibleSellersSeq) dispatch({ type: "SELLERS_LOAD_FAILED" });
      });
  }

  /** Загрузка видимых продавцов с дебаунсом: серия moveend/zoomend схлопывается
   *  в один запрос, почти не изменившиеся границы не перезапрашиваются. */
  function requestVisibleSellers(bounds: MapBounds): void {
    if (lastRequestedBounds && boundsNearlyEqual(lastRequestedBounds, bounds)) return;
    lastRequestedBounds = bounds;
    if (visibleSellersTimer !== null) clearTimeout(visibleSellersTimer);
    visibleSellersTimer = setTimeout(() => loadVisibleSellersNow(bounds), VISIBLE_SELLERS_DEBOUNCE_MS);
  }

  /** Повторная загрузка видимой области (кнопка «Повторить» в Bottom Sheet):
   *  обходит дебаунс и дедупликацию — принудительный перезапрос. */
  function retryVisibleSellers(): void {
    if (lastRequestedBounds) loadVisibleSellersNow(lastRequestedBounds);
  }

  /** Обратное геокодирование центра текущего просмотра (GM-UX-001 «Область
   *  текущего района») с дебаунсом — не дёргает Nominatim на каждый
   *  moveend/zoomend (например, при flyTo оба события приходят сразу). */
  function requestAreaLabel(center: GeoPoint): void {
    if (areaLabelTimer !== null) clearTimeout(areaLabelTimer);
    const seq = ++areaLabelSeq;
    areaLabelTimer = setTimeout(() => {
      void GeoService.reverseGeocode(center).then((label) => {
        if (seq === areaLabelSeq) dispatch({ type: "AREA_LABEL_UPDATED", label });
      });
    }, AREA_LABEL_DEBOUNCE_MS);
  }

  /** Поиск продавцов из мастера (MAP-053/MAP-018): запрос Repository по текущей
   *  точке и радиусу из состояния; перекрытый запрос не перетирает свежий. */
  function requestSellerSearch(): void {
    const search = state.sellerSearch;
    if (!search.origin) return;
    const seq = ++sellerSearchSeq;
    void MockSellerRepository.searchSellersNear({
      origin: search.origin,
      radiusMeters: search.radiusMeters,
      sort: { key: "distance" },
    }).then((sellers) => {
      if (seq === sellerSearchSeq) dispatch({ type: "SELLER_SEARCH_RESULT", sellers });
    });
  }

  /** Смена радиуса мастера: применяется сразу, перезапрос — после дебаунса
   *  на ввод (на каждый символ сеть не дёргаем). */
  function scheduleSellerSearch(radiusMeters: number): void {
    dispatch({ type: "SELLER_SEARCH_RADIUS_CHANGED", radiusMeters });
    if (sellerSearchTimer !== null) clearTimeout(sellerSearchTimer);
    sellerSearchTimer = setTimeout(() => requestSellerSearch(), SELLER_SEARCH_DEBOUNCE_MS);
  }

  /** Отмена отложенного перезапроса (возврат из результатов к выбору точки). */
  function cancelPendingSellerSearch(): void {
    if (sellerSearchTimer !== null) clearTimeout(sellerSearchTimer);
  }

  /** Поиск продавца по имени из строки поиска (MAP-053). Кладёт результат в
   *  state.searchResult и возвращает найденного продавца (null — не найден). */
  async function searchSellerByName(query: string): Promise<SellerMapRecord | null> {
    const found = await MockSellerRepository.findSeller(query);
    dispatch({ type: "SEARCH_RESULT", sellers: found ? [found] : [] });
    return found;
  }

  /** Загрузка категорий для фильтра — источник опций группы «Категория». */
  function loadCategories(): void {
    void MockSellerRepository.getCategories().then((categories) => {
      dispatch({ type: "CATEGORIES_LOADED", categories });
    });
  }

  return {
    getState: (): MapRuntimeState => state,
    dispatch,
    subscribe(listener: () => void): () => void {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    requestVisibleSellers,
    retryVisibleSellers,
    requestAreaLabel,
    requestSellerSearch,
    scheduleSellerSearch,
    cancelPendingSellerSearch,
    searchSellerByName,
    loadCategories,
  };
}

/** Один экземпляр на вкладку — см. комментарий в шапке файла. */
export const MapRuntime = createMapRuntime();
