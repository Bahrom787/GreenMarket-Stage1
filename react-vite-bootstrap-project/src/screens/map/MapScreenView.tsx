import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore, type FormEvent } from 'react';
import { Content, Header, Row, Stack } from '@/layout';
import { Text, IconButton, Icon, BottomSheetSurface, Snackbar } from '@/design-system/components';
import { BottomSheetContainer, SnackbarContainer } from '@/containers';
import { useGreenMarketRuntime } from '@/platform-core/navigation-runtime-layer/hooks/useGreenMarketRuntime';
import type { SellerId } from '@/platform-core/contracts/Action';
import { MockSellerRepository } from '@/platform-core/map/repository/MockSellerRepository';
import { GeoService } from '@/platform-core/map/gis/GeoService';
import { MapAdapter } from '@/platform-core/map/gis/MapAdapter';
import type { CameraChangeReason } from '@/platform-core/map/gis/MapAdapterTypes';
import { MapBuilder } from '@/platform-core/map/builders/MapBuilder';
import { MapRuntime } from '@/platform-core/map/runtime/MapRuntime';
import { Diagnostics } from '@/platform-core/diagnostics/Diagnostics';
import type { CameraParams, GeoPoint, MapBounds, MapViewModel } from '@/platform-core/map/viewmodels/MapViewModel';
import { MapBottomSheetContent } from '@/screens/map/MapBottomSheetContent';
import { MapLocationButton } from '@/screens/map/MapLocationButton';

/**
 * Экран Map (IMP-003.1 → IMP-003.1.1 → IMP-003.1.2). Архитектура:
 *   Mock Repository → Runtime → MapViewModel → Builder → Layout → Design System.
 *
 * §8 IMP-003.1.2: единственный источник состояния экрана — MapRuntime (см.
 * platform-core/map/runtime/MapRuntime.ts). Этот компонент подписан на него
 * через useSyncExternalStore и является чистым отображением — сам не хранит
 * ни выбранного продавца, ни камеру, ни Bottom Sheet, ни результаты поиска;
 * единственное локальное состояние — текст в поле поиска (это ввод
 * пользователя, а не производное доменное состояние из §9 ViewModel).
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

  /** Показывает snackbar об ошибке геолокации (MAP-005 §4) и автоматически
   *  скрывает его через несколько секунд. Повторное нажатие кнопки
   *  перезапускает таймер скрытия. */
  const showLocationNotice = useCallback((kind: 'unavailable' | 'no-permission') => {
    setLocationNotice(kind);
    if (locationNoticeTimerRef.current !== null) window.clearTimeout(locationNoticeTimerRef.current);
    locationNoticeTimerRef.current = window.setTimeout(() => setLocationNotice(null), 4000);
  }, []);

  const areaLabelTimerRef = useRef<number | null>(null);

  /** Обратное геокодирование центра текущего просмотра (GM-UX-001 «Область
   *  текущего района»). Номинативный запрос к Nominatim — дебаунс, чтобы не
   *  дёргать сеть на каждый moveend/zoomend (например, при flyTo срабатывают
   *  оба события сразу). Результат кладётся в MapRuntime (единственный
   *  источник состояния экрана); reverseGeocode не бросает и возвращает null,
   *  если район определить нельзя — область при этом скрывается. */
  const requestAreaLabel = useCallback((center: GeoPoint) => {
    if (areaLabelTimerRef.current !== null) window.clearTimeout(areaLabelTimerRef.current);
    areaLabelTimerRef.current = window.setTimeout(() => {
      void GeoService.reverseGeocode(center).then((label) => {
        MapRuntime.dispatch({ type: 'AREA_LABEL_UPDATED', label });
      });
    }, 500);
  }, []);

  const loadVisibleSellers = useCallback(async (bounds: MapBounds) => {
    MapRuntime.dispatch({ type: 'SELLERS_LOADING' });
    try {
      const visible = await MockSellerRepository.getVisibleSellers(bounds);
      MapRuntime.dispatch({ type: 'SELLERS_LOADED', sellers: visible });
    } catch {
      MapRuntime.dispatch({ type: 'SELLERS_LOAD_FAILED' });
    }
  }, []);

  useEffect(() => {
    dispatch({ type: 'MAP_LOADED' });
    // Начальная загрузка продавцов запускается из onVisibleBoundsChange —
    // он приходит от LeafletAdapter сразу при монтировании карты с реальными
    // границами (а не приближением через радиус, IMP-003.1.2 §3).
    // eslint-disable-next-line react-hooks/exhaustive-deps -- один раз при монтировании экрана
  }, []);

  // Сброс таймеров (snackbar об ошибке геолокации, дебаунс района) при размонтировании экрана.
  useEffect(
    () => () => {
      if (locationNoticeTimerRef.current !== null) window.clearTimeout(locationNoticeTimerRef.current);
      if (areaLabelTimerRef.current !== null) window.clearTimeout(areaLabelTimerRef.current);
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
      void loadVisibleSellers(bounds);
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
    // Перед запросом проверяем состояние разрешения (Permissions API). Если
    // браузер явно запретил доступ — из JS повторный промпт невозможен:
    // после отказа браузер не спросит снова, пока пользователь вручную не
    // разрешит геолокацию в настройках сайта. Поэтому сразу показываем
    // «Нет доступа к геолокации» и не дёргаем API впустую.
    const permission = await GeoService.getPermissionState();
    if (permission === 'denied') {
      showLocationNotice('no-permission');
      return;
    }
    try {
      const location = await GeoService.getCurrentLocation();
      MapRuntime.dispatch({ type: 'CENTER_ON_USER_SUCCESS', location });
      setCenterRequestToken((t) => t + 1);
      requestAreaLabel(location);
    } catch {
      // IMP-003.1.1 §5 / IMP-003.1.2 §7: нет разрешения/недоступна
      // геолокация — экран продолжает работать без ошибок; положение карты
      // при этом не меняется.
      //
      // TODO (логирование): в будущем сюда нужно добавить логирование
      // ошибки геолокации через общую систему диагностики, например
      // Diagnostics.track('map.locate_failed', { error }) — см.
      // platform-core/diagnostics/Diagnostics.ts. Для этого в catch нужно
      // принимать сам объект ошибки (catch (error: unknown)) и передавать
      // его в track(), а не глотать молча, как сейчас.
      showLocationNotice('unavailable');
    }
  }, [dispatch, showLocationNotice, requestAreaLabel]);

  const handleOpenSellerList = useCallback(() => dispatch({ type: 'OPEN_SELLER_LIST' }), [dispatch]);
  const handleOpenCatalog = useCallback(() => dispatch({ type: 'OPEN_CATALOG' }), [dispatch]);

  const handleOpenSellerCard = useCallback(() => {
    if (!mapState.selectedSellerId) return;
    Diagnostics.track('map.open_seller_card', { sellerId: mapState.selectedSellerId });
    dispatch({ type: 'OPEN_SELLER', payload: { sellerId: mapState.selectedSellerId } });
  }, [dispatch, mapState.selectedSellerId]);

  const handleSearchSubmit = useCallback(
    async (event: FormEvent) => {
      event.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;
      const found = await MockSellerRepository.findSeller(query);
      MapRuntime.dispatch({ type: 'SEARCH_RESULT', sellers: found ? [found] : [] });
      if (found) {
        // §6: центрирование карты + автоматическое открытие Bottom Sheet.
        MapRuntime.dispatch({ type: 'MOVE_MAP', center: found.location, zoom: 15 });
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

        <Stack
          gap="sm"
          style={{ position: 'absolute', right: 'var(--space-lg)', bottom: 'var(--space-xxl)', zIndex: 10 }}
        >
          <IconButton label="Открыть каталог" onClick={handleOpenCatalog} data-testid="open-catalog">
            <Icon label="Каталог">🛒</Icon>
          </IconButton>
          <IconButton
            label="Показать ближайших продавцов"
            onClick={() => lastBounds && void loadVisibleSellers(lastBounds)}
          >
            <Icon label="Рядом">🧭</Icon>
          </IconButton>
          <MapLocationButton onLocate={() => void handleCenterOnUser()} />
        </Stack>
      </Content>

      {mapState.bottomSheet === 'sellerSummary' && (
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
            <MapBottomSheetContent
              blocks={bottomSheetBlocks}
              onRetry={() => lastBounds && void loadVisibleSellers(lastBounds)}
              onOpenSeller={handleOpenSellerCard}
            />
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
