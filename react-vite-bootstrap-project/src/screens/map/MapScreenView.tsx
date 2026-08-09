import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Content, Header, Row, Stack } from '@/layout';
import { Text, IconButton, Icon, BottomSheetSurface, Snackbar } from '@/design-system/components';
import { BottomSheetContainer, SnackbarContainer } from '@/containers';
import { useGreenMarketRuntime } from '@/platform-core/navigation-runtime-layer/hooks/useGreenMarketRuntime';
import type { Action, SellerId } from '@/platform-core/contracts/Action';
import { MockSellerRepository } from '@/platform-core/map/repository/MockSellerRepository';
import { GeoService } from '@/platform-core/map/gis/GeoService';
import { MapAdapter } from '@/platform-core/map/gis/MapAdapter';
import type { CameraChangeReason } from '@/platform-core/map/gis/MapAdapterTypes';
import { MapBuilder } from '@/platform-core/map/builders/MapBuilder';
import { DEFAULT_SELLER_SEARCH_RADIUS_METERS, MapRuntime } from '@/platform-core/map/runtime/MapRuntime';
import { Diagnostics } from '@/platform-core/diagnostics/Diagnostics';
import type { CameraParams, GeoPoint, MapBounds, MapViewModel } from '@/platform-core/map/viewmodels/MapViewModel';
import { MapBottomSheetContent } from '@/screens/map/MapBottomSheetContent';
import { MapFabButton } from '@/screens/map/MapFabButton';
import { SellerFilter } from '@/screens/filter/SellerFilter';

/** Дебаунс на ввод радиуса «Поиска продавцов» (MAP-053/MAP-018): перезапрос
 *  запускается после паузы в наборе, а не на каждый символ. */
const SELLER_SEARCH_DEBOUNCE_MS = 500;
/** Зум при центрировании на конкретного продавца (поиск / выбор из списка). */
const ZOOM_ON_SELLER = 15;

/** «Км → метры» для поля радиуса: запятая считается десятичной точкой;
 *  пустое/нечисловое/неположительное значение возвращает null (поиск не
 *  запускается, предыдущие результаты остаются). */
function parseRadiusKmToMeters(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!normalized) return null;
  const km = Number(normalized);
  if (!Number.isFinite(km) || km <= 0) return null;
  return Math.round(km * 1000);
}

/**
 * Экран Map (IMP-003.1 → IMP-003.1.1 → IMP-003.1.2). Архитектура:
 *   Mock Repository → Runtime → MapViewModel → Builder → Layout → Design System.
 *
 * §8 IMP-003.1.2: единственный источник состояния экрана — MapRuntime (см.
 * platform-core/map/runtime/MapRuntime.ts). Этот компонент подписан на него
 *  через useSyncExternalStore и является чистым отображением — сам не хранит
 *  ни выбранного продавца, ни камеру, ни Bottom Sheet, ни результаты поиска;
 *  локальное состояние — только поля ввода пользователя (поиск и радиус
 *  мастера «Поиск продавцов») и технические refs (таймеры/дебаунсы), но не
 *  производное доменное состояние из §9 ViewModel.
 *
 * Навигационные действия (OPEN_SELLER, OPEN_SELLER_LIST, OPEN_CATALOG,
 * MAP_LOADED и т.д.) по-прежнему проходят через общий GreenMarketRuntime —
 * MapRuntime дополняет его доменным слоем, а не заменяет Action Catalog.
 */
export function MapScreenView() {
  const { dispatch } = useGreenMarketRuntime();
  const mapState = useSyncExternalStore(MapRuntime.subscribe, MapRuntime.getState);

  const [centerRequestToken, setCenterRequestToken] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [lastBounds, setLastBounds] = useState<MapBounds | null>(null);
  const [locationNotice, setLocationNotice] = useState<'unavailable' | 'no-permission' | null>(null);
  const locationNoticeTimerRef = useRef<number | null>(null);
  const [searchRadiusKm, setSearchRadiusKm] = useState('5');
  const sellerSearchTimerRef = useRef<number | null>(null);
  const sellerSearchSeqRef = useRef(0);

  /** Показывает snackbar об ошибке геолокации (MAP-005 §4) и автоматически
   *  скрывает его через несколько секунд. Повторное нажатие кнопки
   *  перезапускает таймер скрытия. */
  const showLocationNotice = useCallback((kind: 'unavailable' | 'no-permission') => {
    setLocationNotice(kind);
    if (locationNoticeTimerRef.current !== null) window.clearTimeout(locationNoticeTimerRef.current);
    locationNoticeTimerRef.current = window.setTimeout(() => setLocationNotice(null), 4000);
  }, []);

  /** Запрос геолокации с общей обработкой ошибок для всех кнопок карты
   *  (кнопка «Моё местоположение» и выбор точки «Моё местоположение» в
   *  мастере «Поиск продавцов»).
   *  Возвращает координаты либо null (при этом пользователь уже получил
   *  snackbar, положение карты не меняется). */
  const resolveUserLocation = useCallback(async (): Promise<GeoPoint | null> => {
    // Если браузер явно запретил доступ — повторный промпт из JS невозможен,
    // поэтому не дёргаем API впустую и сразу показываем «Нет доступа».
    const permission = await GeoService.getPermissionState();
    if (permission === 'denied') {
      showLocationNotice('no-permission');
      return null;
    }
    try {
      return await GeoService.getCurrentLocation();
    } catch {
      // IMP-003.1.1 §5 / IMP-003.1.2 §7: нет разрешения/недоступна
      // геолокация — экран продолжает работать без ошибок.
      showLocationNotice('unavailable');
      return null;
    }
  }, [showLocationNotice]);

  const areaLabelTimerRef = useRef<number | null>(null);
  const areaLabelRequestSeqRef = useRef(0);

  const sellersLoadTimerRef = useRef<number | null>(null);
  const sellersLoadRequestSeqRef = useRef(0);

  /** Обратное геокодирование центра текущего просмотра (GM-UX-001 «Область
   *  текущего района»). Номинативный запрос к Nominatim — дебаунс, чтобы не
   *  дёргать сеть на каждый moveend/zoomend (например, при flyTo срабатывают
   *  оба события сразу). Результат кладётся в MapRuntime (единственный
   *  источник состояния экрана); reverseGeocode не бросает и возвращает null,
   *  если район определить нельзя — область при этом скрывается.
   *  Защита от гонки состояний: каждый новый запрос увеличивает
   *  areaLabelRequestSeqRef; устаревший ответ (запрос уже не последний) —
   *  игнорируется, чтобы более поздний запрос не был перетёрт. */
  const requestAreaLabel = useCallback((center: GeoPoint) => {
    if (areaLabelTimerRef.current !== null) window.clearTimeout(areaLabelTimerRef.current);
    const seq = ++areaLabelRequestSeqRef.current;
    areaLabelTimerRef.current = window.setTimeout(() => {
      void GeoService.reverseGeocode(center).then((label) => {
        if (seq === areaLabelRequestSeqRef.current) {
          MapRuntime.dispatch({ type: 'AREA_LABEL_UPDATED', label });
        }
      });
    }, 500);
  }, []);

  /** Загрузка продавцов через Repository (MAP-011). Защита от гонки
   *  состояний: каждый вызов увеличивает sellersLoadRequestSeqRef, а ответ
   *  применяется, только если загрузка всё ещё последняя — поздний ответ
   *  устаревшей загрузки (перекрытой новой) не перетирает свежий. */
  const loadVisibleSellers = useCallback(async (bounds: MapBounds) => {
    const seq = ++sellersLoadRequestSeqRef.current;
    MapRuntime.dispatch({ type: 'SELLERS_LOADING' });
    try {
      const visible = await MockSellerRepository.getVisibleSellers(bounds);
      if (seq === sellersLoadRequestSeqRef.current) {
        MapRuntime.dispatch({ type: 'SELLERS_LOADED', sellers: visible });
      }
    } catch {
      if (seq === sellersLoadRequestSeqRef.current) {
        MapRuntime.dispatch({ type: 'SELLERS_LOAD_FAILED' });
      }
    }
  }, []);

  useEffect(() => {
    dispatch({ type: 'MAP_LOADED' });
    // Начальная загрузка продавцов запускается из onVisibleBoundsChange —
    // он приходит от LeafletAdapter сразу при монтировании карты с реальными
    // границами (а не приближением через радиус, IMP-003.1.2 §3).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- один раз при монтировании экрана
  }, []);

  // Загрузка каталога категорий для выпадающего фильтра (MapRuntime хранит
  // их как источник для UI; singleton переживает уход/возврат на экран).
  useEffect(() => {
    void MockSellerRepository.getCategories().then((cats) => {
      MapRuntime.dispatch({ type: 'CATEGORIES_LOADED', categories: cats });
    });
  }, []);

  // Сброс таймеров (snackbar об ошибке геолокации, дебаунсы района, загрузки
  // продавцов и радиуса «Поиска продавцов») при размонтировании экрана.
  useEffect(
    () => () => {
      if (locationNoticeTimerRef.current !== null) window.clearTimeout(locationNoticeTimerRef.current);
      if (areaLabelTimerRef.current !== null) window.clearTimeout(areaLabelTimerRef.current);
      if (sellersLoadTimerRef.current !== null) window.clearTimeout(sellersLoadTimerRef.current);
      if (sellerSearchTimerRef.current !== null) window.clearTimeout(sellerSearchTimerRef.current);
    },
    [],
  );

  const handleVisibleBoundsChange = useCallback(
    (bounds: MapBounds) => {
      // §5/§13: не перезапрашивать Repository, если границы почти не
      // изменились (например, повторный moveend с теми же координатами).
      if (
        lastBounds &&
        Math.abs(lastBounds.north - bounds.north) < 0.0001 &&
        Math.abs(lastBounds.south - bounds.south) < 0.0001 &&
        Math.abs(lastBounds.east - bounds.east) < 0.0001 &&
        Math.abs(lastBounds.west - bounds.west) < 0.0001
      ) {
        return;
      }
      setLastBounds(bounds);
      // MAP-011: настоящий debounce на onVisibleBoundsChange — при
      // непрерывном движении/зуме карты серия moveend/zoomend схлопывается
      // в один запрос к Repository после паузы, а не на каждый кадр.
      if (sellersLoadTimerRef.current !== null) window.clearTimeout(sellersLoadTimerRef.current);
      sellersLoadTimerRef.current = window.setTimeout(() => {
        void loadVisibleSellers(bounds);
      }, 500);
    },
    [lastBounds, loadVisibleSellers],
  );

  const handleCameraChange = useCallback(
    (next: CameraParams, reason: CameraChangeReason) => {
      if (reason === 'zoom') {
        MapRuntime.dispatch({ type: 'ZOOM_MAP', zoom: next.zoom });
        dispatch({ type: 'ZOOM_MAP', payload: { zoom: next.zoom } });
      } else {
        MapRuntime.dispatch({ type: 'MOVE_MAP', center: next.center, zoom: next.zoom });
        dispatch({ type: 'MOVE_MAP', payload: next });
      }
      requestAreaLabel(next.center);
    },
    [dispatch, requestAreaLabel],
  );

  const handleSellerSelect = useCallback(
    (sellerId: SellerId) => {
      dispatch({ type: 'SELECT_SELLER', payload: { sellerId } });
      MapRuntime.dispatch({ type: 'SELECT_SELLER', sellerId });
    },
    [dispatch],
  );

  const handleUnselect = useCallback(() => {
    dispatch({ type: 'UNSELECT_SELLER' });
    MapRuntime.dispatch({ type: 'UNSELECT_SELLER' });
  }, [dispatch]);

  const handleCenterOnUser = useCallback(async () => {
    dispatch({ type: 'CENTER_ON_USER' });
    const location = await resolveUserLocation();
    if (!location) return;
    MapRuntime.dispatch({ type: 'CENTER_ON_USER_SUCCESS', location });
    setCenterRequestToken((t) => t + 1);
    requestAreaLabel(location);
  }, [dispatch, resolveUserLocation, requestAreaLabel]);

  const handleOpenSellerList = useCallback(() => dispatch({ type: 'OPEN_SELLER_LIST' }), [dispatch]);
  const handleOpenCatalog = useCallback(() => dispatch({ type: 'OPEN_CATALOG' }), [dispatch]);

  /** «Поиск продавцов» (MAP-053/MAP-018). Открывает мастер: выбор точки —
   *  «Моё местоположение» (геолокация с той же обработкой ошибок, что у
   *  кнопки «Моё местоположение») или «Положение на карте» (центр текущего
   *  просмотра), затем ввод радиуса и результаты, отсортированные по
   *  расстоянию. Состояние шага/точки/радиуса/результатов живёт в MapRuntime
   *  (reducer-кейсы SELLER_SEARCH_*). */
  const runSellerSearch = useCallback(async () => {
    const search = MapRuntime.getState().sellerSearch;
    if (!search.origin) return;
    const seq = ++sellerSearchSeqRef.current;
    const sellers = await MockSellerRepository.searchSellersNear({
      origin: search.origin,
      radiusMeters: search.radiusMeters,
      sort: { key: 'distance' },
    });
    if (seq === sellerSearchSeqRef.current) {
      MapRuntime.dispatch({ type: 'SELLER_SEARCH_RESULT', sellers });
    }
  }, []);

  /** Открытие мастера «Поиск продавцов»: новый поиск всегда начинается с
   *  выбора точки и сбрасывает радиус на значение по умолчанию. */
  const handleOpenSellerSearch = useCallback(() => {
    setSearchRadiusKm(String(DEFAULT_SELLER_SEARCH_RADIUS_METERS / 1000));
    MapRuntime.dispatch({ type: 'SELLER_SEARCH_OPEN' });
  }, []);

  /** Шаг «Выбрать точку» → «Моё местоположение»: запрос геолокации с общей
   *  обработкой ошибок; при успехе свежая позиция становится «Моё
   *  местоположение» (📍 центрируется на неё) и сразу запускается поиск. */
  const handleSearchOriginMyLocation = useCallback(async () => {
    const location = await resolveUserLocation();
    if (!location) return;
    MapRuntime.dispatch({ type: 'CENTER_ON_USER_SUCCESS', location });
    setCenterRequestToken((t) => t + 1);
    requestAreaLabel(location);
    MapRuntime.dispatch({ type: 'SELLER_SEARCH_ORIGIN_PICKED', origin: location, label: 'Моё местоположение' });
    void runSellerSearch();
  }, [resolveUserLocation, requestAreaLabel, runSellerSearch]);

  /** Шаг «Выбрать точку» → «Положение на карте»: точка = центр текущего
   *  просмотра (карта при этом не двигается). */
  const handleSearchOriginMapCenter = useCallback(() => {
    MapRuntime.dispatch({
      type: 'SELLER_SEARCH_ORIGIN_PICKED',
      origin: MapRuntime.getState().mapCenter,
      label: 'Положение на карте',
    });
    void runSellerSearch();
  }, [runSellerSearch]);

  /** Ввод радиуса в окне результатов: значение сразу применяется к текущим
   *  результатам (SELLER_SEARCH_RADIUS_CHANGED), а перезапрос к Repository
   *  дебаунсится — на каждый символ сеть не дёргаем. */
  const handleSearchRadiusInput = useCallback(
    (value: string) => {
      setSearchRadiusKm(value);
      const radiusMeters = parseRadiusKmToMeters(value);
      if (!radiusMeters) return;
      MapRuntime.dispatch({ type: 'SELLER_SEARCH_RADIUS_CHANGED', radiusMeters });
      if (sellerSearchTimerRef.current !== null) window.clearTimeout(sellerSearchTimerRef.current);
      sellerSearchTimerRef.current = window.setTimeout(() => {
        void runSellerSearch();
      }, SELLER_SEARCH_DEBOUNCE_MS);
    },
    [runSellerSearch],
  );

  /** «Назад» из окна результатов: возврат к выбору точки (введённый радиус
   *  сохраняется) и отмена отложенного перезапроса. */
  const handleSearchBack = useCallback(() => {
    if (sellerSearchTimerRef.current !== null) window.clearTimeout(sellerSearchTimerRef.current);
    MapRuntime.dispatch({ type: 'SELLER_SEARCH_BACK' });
  }, []);

  /** Выбор строки в окне Bottom Sheet (и «Ваша область», и результаты
   *  поиска продавцов): центрирование на продавца + открытие его карточки
   *  (как при выборе маркера на карте). Продавец ищется и в результатах
   *  поиска, и в видимой области — строки могут прийти из любой секции. */
  const handleSelectListSeller = useCallback(
    (sellerId: SellerId) => {
      const target =
        mapState.sellerSearch.results.find((s) => s.sellerId === sellerId) ??
        mapState.visibleSellers.find((s) => s.sellerId === sellerId) ??
        null;
      if (!target) return;
      MapRuntime.dispatch({ type: 'MOVE_MAP', center: target.location, zoom: ZOOM_ON_SELLER });
      MapRuntime.dispatch({ type: 'SELECT_SELLER', sellerId });
      dispatch({ type: 'SELECT_SELLER', payload: { sellerId } });
      setCenterRequestToken((t) => t + 1);
    },
    [mapState.sellerSearch, mapState.visibleSellers, dispatch],
  );

  const handleFilterChange = useCallback(
    (groupId: string, optionIds: string[]) => MapRuntime.dispatch({ type: 'SET_FILTER_OPTIONS', groupId, optionIds }),
    [],
  );

  const handleOpenSellerCard = useCallback(() => {
    if (!mapState.selectedSellerId) return;
    Diagnostics.track('map.open_seller_card', { sellerId: mapState.selectedSellerId });
    dispatch({ type: 'OPEN_SELLER', payload: { sellerId: mapState.selectedSellerId } });
  }, [dispatch, mapState.selectedSellerId]);

  /** Действия из блоков Bottom Sheet (карточка продавца / окно с секциями
   *  «Ваша область» и «Ближайшие» / мастер «Поиск продавцов»): "Открыть
   *  продавца" из карточки, "выбрать продавца" из любой секции списка и
   *  выбор точки поиска (геолокация или центр экрана). */
  const handleBlockAction = useCallback(
    (action: Action) => {
      switch (action.type) {
        case 'OPEN_SELLER':
          handleOpenSellerCard();
          break;
        case 'SELECT_SELLER':
          handleSelectListSeller(action.payload.sellerId);
          break;
        case 'SEARCH_ORIGIN_MY_LOCATION':
          void handleSearchOriginMyLocation();
          break;
        case 'SEARCH_ORIGIN_MAP_CENTER':
          handleSearchOriginMapCenter();
          break;
      }
    },
    [handleOpenSellerCard, handleSelectListSeller, handleSearchOriginMyLocation, handleSearchOriginMapCenter],
  );

  const handleSearchSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;
      const found = await MockSellerRepository.findSeller(query);
      MapRuntime.dispatch({ type: 'SEARCH_RESULT', sellers: found ? [found] : [] });
      if (found) {
        // §6: центрирование карты + автоматическое открытие Bottom Sheet.
        MapRuntime.dispatch({ type: 'MOVE_MAP', center: found.location, zoom: ZOOM_ON_SELLER });
        MapRuntime.dispatch({ type: 'SELECT_SELLER', sellerId: found.sellerId });
        dispatch({ type: 'SELECT_SELLER', payload: { sellerId: found.sellerId } });
        setCenterRequestToken((t) => t + 1);
      }
    },
    [searchQuery, dispatch],
  );

  const camera: CameraParams = useMemo(
    () => ({ center: mapState.mapCenter, zoom: mapState.zoom }),
    [mapState.mapCenter, mapState.zoom],
  );

  const viewModel: MapViewModel = useMemo(
    () => ({
      state: mapState.error ? 'error' : mapState.loading ? 'loading' : mapState.visibleSellers.length === 0 ? 'empty' : 'success',
      sellers: mapState.visibleSellers,
      selectedSellerId: mapState.selectedSellerId,
      userLocation: mapState.userLocation,
      camera,
      bottomSheet: mapState.bottomSheet,
      sellerSearch: mapState.sellerSearch,
      currentAreaLabel: mapState.currentAreaLabel,
    }),
    [mapState, camera],
  );

  const bottomSheetBlocks = useMemo(() => MapBuilder.build(viewModel), [viewModel]);

  return (
    <div data-testid="map-screen" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      <Header>
        <Row gap="md" align="center" justify="between" style={{ position: 'relative', width: '100%' }}>
          <Text variant="title" as="span">
            🌿 GreenMarket
          </Text>
          <form
            onSubmit={(e) => void handleSearchSubmit(e)}
            style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', width: '100%', maxWidth: 360 }}
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Найти продавца"
              aria-label="Поиск продавца"
              data-testid="map-search"
              style={{
                width: '100%',
                height: 36,
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--color-border-default)',
                padding: '0 var(--space-md)',
                fontFamily: 'var(--font-family-body)',
                fontSize: 'var(--font-size-sm)',
                background: 'var(--color-surface-sunken)',
                color: 'var(--color-text-primary)',
              }}
            />
          </form>
          <Row gap="sm">
            <SellerFilter
              categories={mapState.categories}
              selectedFilters={mapState.selectedFilters}
              onChange={handleFilterChange}
            />
            <IconButton label="Список продавцов" onClick={handleOpenSellerList}>
              <Icon label="Список">📋</Icon>
            </IconButton>
          </Row>
        </Row>
      </Header>

      {mapState.currentAreaLabel && (
        <div data-testid="current-area-label" style={{ padding: 'var(--space-xs) var(--space-lg)' }}>
          <Text variant="caption" tone="secondary">
            📍 {mapState.currentAreaLabel}
          </Text>
        </div>
      )}

      <Content style={{ position: 'relative', flex: 1, padding: 0 }}>
        <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
          <MapAdapter
            sellers={mapState.visibleSellers}
            selectedSellerId={mapState.selectedSellerId}
            userLocation={mapState.userLocation}
            camera={camera}
            onMapLoaded={() => dispatch({ type: 'MAP_LOADED' })}
            onCameraChange={handleCameraChange}
            onVisibleBoundsChange={handleVisibleBoundsChange}
            onSellerSelect={handleSellerSelect}
            onMapBackgroundClick={handleUnselect}
            centerRequestToken={centerRequestToken}
          />
        </div>

        {/* Плавающая панель действий: белая поверхность, чтобы иконки не
            сливались с картой; кнопки равноудалены (gap = --space-sm). */}
        <div className="gm-map-fab-panel">
          <MapFabButton label="Открыть каталог" icon="🛒" onClick={handleOpenCatalog} testId="open-catalog" />
          <MapFabButton label="Поиск продавцов" icon="🧭" onClick={handleOpenSellerSearch} testId="open-seller-search" />
          <MapFabButton label="Моё местоположение" icon="📍" onClick={() => void handleCenterOnUser()} />
        </div>
      </Content>

      {/* Bottom Sheet открыт и для карточки продавца, и для окон мастера
          «Поиск продавцов» — всё живёт в MapRuntime.bottomSheet. Шаги мастера
          рендерят собственный заголовок (и «назад» для результатов), ввод
          радиуса и единый фильтр продавцов; список строк строит MapBuilder. */}
      {mapState.bottomSheet !== 'hidden' && (
        <BottomSheetContainer
          onDismiss={handleUnselect}
          labelledBy="map-seller-sheet-title"
          data-testid="seller-bottom-sheet"
        >
          <BottomSheetSurface
            closeSlot={
              <IconButton label="Закрыть" onClick={handleUnselect} data-testid="close-bottom-sheet">
                <Icon label="Закрыть">✕</Icon>
              </IconButton>
            }
          >
            {mapState.bottomSheet === 'sellerSearchOrigin' ? (
              <Stack gap="sm">
                <Text variant="title" as="h2" id="map-seller-sheet-title">
                  Поиск продавцов
                </Text>
                <MapBottomSheetContent
                  blocks={bottomSheetBlocks}
                  onRetry={() => lastBounds && void loadVisibleSellers(lastBounds)}
                  onAction={handleBlockAction}
                />
              </Stack>
            ) : mapState.bottomSheet === 'sellerSearchResults' ? (
              <Stack gap="sm" className="gm-seller-search-results">
                {/* Управление (заголовок, радиус, фильтр) не скроллится и не
                    выталкивается длинным списком за экран — см. map.css. */}
                <div className="gm-seller-search-results__controls">
                  <Stack gap="sm">
                    <Row gap="sm" align="center" style={{ position: 'relative', width: '100%' }}>
                      <IconButton label="Назад" onClick={handleSearchBack} data-testid="seller-search-back">
                        <Icon label="Назад">←</Icon>
                      </IconButton>
                      <Text variant="title" as="h2" id="map-seller-sheet-title">
                        Поиск продавцов
                      </Text>
                    </Row>
                    <Stack gap="xs">
                      <label htmlFor="search-radius-input">
                        <Text variant="caption" tone="secondary">
                          Радиус поиска (км)
                        </Text>
                      </label>
                      <input
                        id="search-radius-input"
                        type="number"
                        inputMode="decimal"
                        min={0.5}
                        step={0.5}
                        value={searchRadiusKm}
                        onChange={(e) => handleSearchRadiusInput(e.target.value)}
                        data-testid="search-radius-input"
                        style={{
                          width: '100%',
                          height: 36,
                          borderRadius: 'var(--radius-full)',
                          border: '1px solid var(--color-border-default)',
                          padding: '0 var(--space-md)',
                          fontFamily: 'var(--font-family-body)',
                          fontSize: 'var(--font-size-sm)',
                          background: 'var(--color-surface-sunken)',
                          color: 'var(--color-text-primary)',
                        }}
                      />
                    </Stack>
                    <SellerFilter
                      categories={mapState.categories}
                      selectedFilters={mapState.selectedFilters}
                      onChange={handleFilterChange}
                    />
                  </Stack>
                </div>
                <div className="gm-seller-search-results__list">
                  <MapBottomSheetContent
                    blocks={bottomSheetBlocks}
                    onRetry={() => lastBounds && void loadVisibleSellers(lastBounds)}
                    onAction={handleBlockAction}
                  />
                </div>
              </Stack>
            ) : (
              <MapBottomSheetContent
                blocks={bottomSheetBlocks}
                onRetry={() => lastBounds && void loadVisibleSellers(lastBounds)}
                onAction={handleBlockAction}
              />
            )}
          </BottomSheetSurface>
        </BottomSheetContainer>
      )}

      {locationNotice && (
        <SnackbarContainer>
          <Snackbar tone="error" data-testid="location-error-snackbar">
            {locationNotice === 'no-permission' ? 'Нет доступа к геолокации' : 'Не удалось определить местоположение'}
          </Snackbar>
        </SnackbarContainer>
      )}
    </div>
  );
}
