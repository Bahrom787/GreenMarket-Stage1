import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Text, ErrorState, EmptyState, Button, Chip } from '@/design-system/components';
import { Grid, Stack, Row } from '@/layout';
import { trackEvent } from '@/shared/analytics/AnalyticsReporter';
import { fetchProducts, fetchSeller, fetchSellerProducts, fetchGroups, fetchSellers, CatalogApiError } from '../api';
import { SearchBar } from '../components/SearchBar';
import { SearchFilterBar } from '@/components/search-filter/SearchFilterBar';
import {
  CategoryFilter,
  CategoryToggleContent,
  SelectedCategoryChips,
  type CategoryPanelMode,
} from '@/components/search-filter/CategoryFilter';
import { SellerFilter } from '@/components/search-filter/SellerFilter';
import { StateFilter } from '@/components/search-filter/StateFilter';
import { stateFilterLabel, type StateFilterId } from '@/components/search-filter/stateFilterModel';
import { clearStoredSearchFilters, loadStoredSearchFilters, saveStoredSearchFilters } from '@/components/search-filter/filterStorage';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { toBuyerSellerListRow, type BuyerSellerListRow } from '../sellerListPresentation';
import {
  globalCatalogContext,
  isStoreContext,
  globalStoreModeSearch,
  productPath,
  storeHomePath,
  type CatalogContext,
} from '../catalogContext';
import {
  toGlobalProductCard,
  toStoreProductCard,
  type CatalogProductCardViewModel,
} from '../catalogPresentation';
import {
  catalogGroupIds,
  catalogSellerIds,
  catalogStateIds,
  catalogGroupOptionLabel,
  catalogGroupOptions,
  catalogPage,
  catalogSort,
  clearCatalogSearchParams,
  toggleCatalogGroupParam,
  toggleCatalogStateParam,
  updateCatalogSearchParams,
  type CatalogParam,
} from '../catalogUrlState';
import type { CatalogQuery, ProductGroup } from '../types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; title?: string; message?: string }
  | ({ status: 'ready' } & ReadyPayload);

type ReadyPayload = {
  title: string;
  subtitle?: string;
  products: CatalogProductCardViewModel[];
  page: number;
  limit: number;
  total: number;
};

type GroupsState =
  | { status: 'loading'; groups: ProductGroup[] }
  | { status: 'error'; groups: ProductGroup[]; message: string }
  | { status: 'ready'; groups: ProductGroup[] };

type SellersState =
  | { status: 'loading'; sellers: BuyerSellerListRow[] }
  | { status: 'error'; sellers: BuyerSellerListRow[]; message: string }
  | { status: 'ready'; sellers: BuyerSellerListRow[] };

/** Экран 2 (Buyer_MVP.md): список товаров, поиск, фильтр по категории. */
interface CatalogScreenProps {
  context?: CatalogContext;
}

export function CatalogScreen({ context = globalCatalogContext }: CatalogScreenProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [groupsState, setGroupsState] = useState<GroupsState>({ status: 'loading', groups: [] });
  const [sellersState, setSellersState] = useState<SellersState>({ status: 'loading', sellers: [] });
  const [openFilterGroupId, setOpenFilterGroupId] = useState<string | null>(null);
  const [categoryMode, setCategoryMode] = useState<CategoryPanelMode>('text');
  const [autoCollapseCategories, setAutoCollapseCategories] = useState(true);
  const [categoryPanelActivity, setCategoryPanelActivity] = useState(0);
  const catalogRequestId = useRef(0);
  const restoredStoredFilters = useRef(false);
  const skipStoredFiltersSave = useRef(false);

  const search = searchParams.get('search') ?? '';
  const groupId = searchParams.get('group_id');
  const sellerId = searchParams.get('seller_id');
  const stateId = searchParams.get('state');
  const parsedGroupIds = useMemo(() => catalogGroupIds(groupId), [groupId]);
  const parsedSellerIds = useMemo(() => catalogSellerIds(sellerId), [sellerId]);
  const parsedStateIds = useMemo(() => catalogStateIds(stateId), [stateId]);
  const groupIds = useMemo(() => parsedGroupIds ?? [], [parsedGroupIds]);
  const sellerIds = useMemo(() => parsedSellerIds ?? [], [parsedSellerIds]);
  const stateIds = useMemo(() => (parsedStateIds ?? []) as StateFilterId[], [parsedStateIds]);
  const hasInvalidGroupId = Boolean(groupId && !parsedGroupIds);
  const hasInvalidSellerId = Boolean(sellerId && !parsedSellerIds);
  const hasInvalidStateId = Boolean(stateId && !parsedStateIds);
  const sort = catalogSort(searchParams.get('sort'));
  const page = catalogPage(searchParams.get('page'));
  const isStore = isStoreContext(context);
  const analyticsScreen = isStore ? 'StoreCatalog' : 'GlobalCatalog';
  const storeId = isStore ? context.storeId : undefined;
  const categoriesOpen = openFilterGroupId === 'categories';
  const groups = catalogGroupOptions(groupsState.groups);
  const selectedGroupIds = new Set(groupIds);
  const selectedSellerIds = new Set(sellerIds.map(String));
  const categoryItems = groups.map(({ group, depth }) => ({
    id: group.id,
    name: group.name,
    depth,
    label: catalogGroupOptionLabel({ group, depth }),
    selected: selectedGroupIds.has(group.id),
  }));
  const selectedCategoryItems = categoryItems.filter((item) => item.selected);
  const sellerItems = sellersState.sellers.map((seller) => ({
    id: seller.sellerId,
    name: seller.name,
    selected: selectedSellerIds.has(seller.sellerId),
  }));
  const selectedSellerItems = sellerItems.filter((item) => item.selected);
  const hasAppliedFilters = Boolean(groupIds.length || sellerIds.length || stateIds.length || hasInvalidGroupId || hasInvalidSellerId || hasInvalidStateId);
  const hasFilters = Boolean(search || hasAppliedFilters || sort !== 'name');

  function load() {
    const requestId = catalogRequestId.current + 1;
    catalogRequestId.current = requestId;

    if (hasInvalidGroupId || hasInvalidSellerId || hasInvalidStateId) {
      setState({
        status: 'error',
        message: hasInvalidGroupId
          ? 'Некорректный параметр категории.'
          : hasInvalidSellerId
            ? 'Некорректный параметр продавца.'
            : 'Некорректный параметр состояния.',
      });
      return;
    }

    const query: CatalogQuery = {
      search: search || undefined,
      groupIds,
      sellerIds: isStore ? undefined : sellerIds,
      sort,
      page,
    };

    setState({ status: 'loading' });
    const request: Promise<ReadyPayload> = isStore
      ? Promise.all([fetchSeller(storeId ?? ''), fetchSellerProducts(storeId ?? '', query)]).then(
          ([seller, res]) => ({
            title: seller.name,
            subtitle: seller.market?.name,
            products: res.products.map(toStoreProductCard),
            page: res.page,
            limit: res.limit,
            total: res.total,
          }),
        )
      : fetchProducts(query).then((res) => ({
          title: 'Каталог',
          products: res.products.map(toGlobalProductCard),
          page: res.page,
          limit: res.limit,
          total: res.total,
        }));

    request
      .then((res) => {
        if (requestId !== catalogRequestId.current) return;
        setState({
          status: 'ready',
          title: res.title,
          subtitle: res.subtitle,
          products: res.products,
          page: res.page,
          limit: res.limit,
          total: res.total,
        });
      })
      .catch((err: unknown) => {
        if (requestId !== catalogRequestId.current) return;
        const notFound = isStore && err instanceof CatalogApiError && err.status === 404;
        const message =
          err instanceof CatalogApiError ? err.message : 'Не удалось загрузить товары.';
        setState({
          status: 'error',
          title: notFound ? 'Магазин не найден' : undefined,
          message: notFound ? undefined : message,
        });
      });
  }

  useEffect(load, [search, groupIds, sellerIds, stateIds, sort, page, isStore, storeId, hasInvalidGroupId, hasInvalidSellerId, hasInvalidStateId]);

  useEffect(() => {
    if (isStore || restoredStoredFilters.current) return;
    restoredStoredFilters.current = true;
    if (searchParams.toString()) return;
    const stored = loadStoredSearchFilters();
    if (!stored.searchQuery && stored.sort === 'name' && !stored.categoryIds.length && !stored.sellerIds.length && !stored.stateIds.length) return;
    const next = new URLSearchParams(searchParams);
    if (stored.searchQuery) next.set('search', stored.searchQuery);
    if (stored.categoryIds.length) next.set('group_id', stored.categoryIds.join(','));
    if (stored.sellerIds.length) next.set('seller_id', stored.sellerIds.join(','));
    if (stored.stateIds.length) next.set('state', stored.stateIds.join(','));
    if (stored.sort !== 'name') next.set('sort', stored.sort);
    next.set('page', '1');
    skipStoredFiltersSave.current = true;
    setSearchParams(next, { replace: true });
  }, [isStore, searchParams, setSearchParams]);

  useEffect(() => {
    if (skipStoredFiltersSave.current) {
      skipStoredFiltersSave.current = false;
      return;
    }
    if (!isStore && !hasInvalidGroupId && !hasInvalidSellerId && !hasInvalidStateId) {
      saveStoredSearchFilters({ searchQuery: search, categoryIds: groupIds, sellerIds, stateIds, sort });
    }
  }, [groupIds, hasInvalidGroupId, hasInvalidSellerId, hasInvalidStateId, isStore, search, sellerIds, sort, stateIds]);

  useEffect(() => {
    let active = true;
    setGroupsState((current) => ({ status: 'loading', groups: current.groups }));
    fetchGroups()
      .then((res) => {
        if (active) setGroupsState({ status: 'ready', groups: res.groups });
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          err instanceof CatalogApiError ? err.message : 'Не удалось загрузить категории.';
        setGroupsState((current) => ({ status: 'error', groups: current.groups, message }));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isStore) return;
    let active = true;
    setSellersState((current) => ({ status: 'loading', sellers: current.sellers }));
    fetchSellers()
      .then((res) => {
        if (active) setSellersState({ status: 'ready', sellers: res.sellers.map(toBuyerSellerListRow) });
      })
      .catch((err: unknown) => {
        if (!active) return;
        const message =
          err instanceof CatalogApiError ? err.message : 'Не удалось загрузить продавцов.';
        setSellersState((current) => ({ status: 'error', sellers: current.sellers, message }));
      });
    return () => {
      active = false;
    };
  }, [isStore]);

  function updateParam(key: CatalogParam, value: string | null) {
    setSearchParams(updateCatalogSearchParams(searchParams, key, value));
    if (key === 'search' && value) trackEvent('catalog_search', { screen: analyticsScreen });
    if (key === 'sort' && value) trackEvent('catalog_sort_use', { screen: analyticsScreen, sort: value });
    if (key === 'seller_id') {
      trackEvent('catalog_filter_use', {
        screen: analyticsScreen,
        selected_count: value ? value.split(',').filter(Boolean).length : 0,
      });
    }
  }

  function clearFilters() {
    if (isStore) {
      setSearchParams(clearCatalogSearchParams());
      trackEvent('catalog_filter_use', { screen: analyticsScreen, filter_action: 'clear' });
      return;
    }
    clearStoredSearchFilters();
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('group_id');
    next.delete('seller_id');
    next.delete('state');
    next.set('sort', 'name');
    next.set('page', '1');
    setSearchParams(next);
    trackEvent('catalog_filter_use', { screen: analyticsScreen, filter_action: 'clear' });
  }

  function toggleGroup(groupId: number) {
    updateParam('group_id', toggleCatalogGroupParam(groupIds, groupId));
    trackEvent('catalog_category_select', { screen: analyticsScreen, category_id: groupId });
    setCategoryPanelActivity((value) => value + 1);
  }

  function toggleSeller(sellerId: number) {
    const next = toggleCatalogGroupParam(sellerIds, sellerId);
    updateParam('seller_id', next);
    trackEvent('catalog_filter_use', { screen: analyticsScreen, selected_count: next ? next.split(',').length : 0 });
  }

  function toggleState(stateId: StateFilterId) {
    updateParam('state', toggleCatalogStateParam(stateIds, stateId));
    trackEvent('catalog_filter_use', { screen: analyticsScreen, filter: stateId });
  }

  function touchCategoryPanel() {
    setCategoryPanelActivity((value) => value + 1);
  }

  useEffect(() => {
    if (isStore || !categoriesOpen || !autoCollapseCategories) return;
    const timer = window.setTimeout(() => {
      trackEvent('category_autocollapse', { screen: analyticsScreen, reason: 'timer' });
      trackEvent('category_panel_collapse', { screen: analyticsScreen, reason: 'timer' });
      setOpenFilterGroupId(null);
    }, 7000);
    return () => window.clearTimeout(timer);
  }, [isStore, categoriesOpen, autoCollapseCategories, categoryPanelActivity, analyticsScreen]);

  useEffect(() => {
    if (isStore || !categoriesOpen) return;
    const collapse = () => {
      trackEvent('category_autocollapse', { screen: analyticsScreen, reason: 'catalog_scroll' });
      trackEvent('category_panel_collapse', { screen: analyticsScreen, reason: 'catalog_scroll' });
      setOpenFilterGroupId(null);
    };
    window.addEventListener('scroll', collapse, { passive: true });
    return () => window.removeEventListener('scroll', collapse);
  }, [isStore, categoriesOpen, analyticsScreen]);

  function productRoute(product: CatalogProductCardViewModel) {
    const next = new URLSearchParams(searchParams);
    if (isStore && product.sellerProductId != null) {
      next.set('seller_product_id', String(product.sellerProductId));
    } else {
      next.delete('seller_product_id');
    }
    const routeSearch = next.toString();
    return productPath(context, product.id, routeSearch ? `?${routeSearch}` : '');
  }

  return (
    <Stack gap="lg">
      {isStore && (
        <Row align="center" justify="between">
          <Stack gap="xs">
            {state.status === 'ready' ? (
              <Text variant="headline" as="h1">
                {state.title}
              </Text>
            ) : state.status === 'loading' ? (
              <div
                aria-label="Загрузка магазина"
                className="gm-catalog-title-skeleton"
                data-testid="store-catalog-title-skeleton"
              />
            ) : null}
            {state.status === 'ready' && state.subtitle && (
              <Text tone="secondary">{state.subtitle}</Text>
            )}
          </Stack>
          {storeId && (
            <Row gap="sm" wrap>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => navigate(`${storeHomePath(storeId)}${globalStoreModeSearch(location.search)}`)}
              >
                О магазине
              </Button>
            </Row>
          )}
        </Row>
      )}

      <Stack gap="sm" className="gm-catalog-filters">
        {isStore ? (
          <>
            <SearchBar initialValue={search} onSearch={(value) => updateParam('search', value || null)} />
            <Row gap="sm" wrap align="center" aria-label="Категории">
              <Text variant="caption" as="span">
                Категории
              </Text>
              {groups.map(({ group, depth }) => (
                <Chip
                  key={group.id}
                  selected={selectedGroupIds.has(group.id)}
                  disabled={groupsState.status === 'loading'}
                  onClick={() => toggleGroup(group.id)}
                >
                  {catalogGroupOptionLabel({ group, depth })}
                </Chip>
              ))}
              {groupsState.status === 'loading' && <Text tone="secondary">Категории загружаются</Text>}
              {groupsState.status === 'error' && <Text tone="secondary">{groupsState.message}</Text>}
            </Row>
            <Row gap="sm" wrap>
              <Button variant={sort === 'name' ? 'primary' : 'secondary'} size="sm" onClick={() => updateParam('sort', 'name')}>
                По названию
              </Button>
              <Button variant={sort === 'price' ? 'primary' : 'secondary'} size="sm" onClick={() => updateParam('sort', 'price')}>
                По цене
              </Button>
              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Очистить фильтры
                </Button>
              )}
            </Row>
          </>
        ) : (
          <SearchFilterBar
            className={`gm-catalog-search-filter gm-catalog-search-filter--${categoryMode}`}
            searchSlot={<SearchBar initialValue={search} onSearch={(value) => updateParam('search', value || null)} />}
            groups={[
              {
                id: 'categories',
                label: 'Категории',
                count: selectedCategoryItems.length,
                testId: 'catalog-category-toggle',
                ariaLabel: `Категории, выбрано ${selectedCategoryItems.length}`,
                triggerContent: <CategoryToggleContent mode={categoryMode} count={selectedCategoryItems.length} />,
                panel: (
                  <CategoryFilter
                    items={categoryItems}
                    mode={categoryMode}
                    autoCollapse={autoCollapseCategories}
                    onModeChange={(mode) => {
                      setCategoryMode(mode);
                      trackEvent(mode === 'text' ? 'category_view_mode_text' : 'category_view_mode_icon', { screen: analyticsScreen });
                    }}
                    onAutoCollapseChange={setAutoCollapseCategories}
                    onToggle={(id) => toggleGroup(Number(id))}
                    onInteract={touchCategoryPanel}
                    loading={groupsState.status === 'loading'}
                    error={groupsState.status === 'error' ? groupsState.message : undefined}
                    testIdPrefix="catalog"
                  />
                ),
              },
              {
                id: 'sellers',
                label: 'Продавцы',
                count: selectedSellerItems.length,
                testId: 'catalog-seller-toggle',
                ariaLabel: `Продавцы, выбрано ${selectedSellerItems.length}`,
                panel: (
                  <SellerFilter
                    items={sellerItems}
                    status={sellersState.status}
                    error={sellersState.status === 'error' ? sellersState.message : undefined}
                    onToggle={(id) => toggleSeller(Number(id))}
                    testId="catalog-seller-panel-body"
                  />
                ),
              },
              {
                id: 'state',
                label: 'Состояние',
                count: stateIds.length,
                testId: 'catalog-state-toggle',
                ariaLabel: `Состояние, выбрано ${stateIds.length}`,
                panel: (
                  <StateFilter
                    selected={stateIds}
                    onToggle={toggleState}
                    testId="catalog-state-filter"
                  />
                ),
              },
            ]}
            openGroupId={openFilterGroupId}
            onOpenGroupChange={(id) => {
              const nextOpen = id === 'categories';
              if (nextOpen !== categoriesOpen) {
                trackEvent(nextOpen ? 'category_panel_open' : 'category_panel_collapse', { screen: analyticsScreen });
              }
              setOpenFilterGroupId(id);
              setCategoryPanelActivity((value) => value + 1);
            }}
            autoCollapseMs={7000}
            autoCollapseEnabled={autoCollapseCategories}
            activityKey={categoryPanelActivity}
            hasFilters={hasFilters}
            onClearFilters={clearFilters}
            sortSlot={
              <Row gap="sm" wrap>
                <Button variant={sort === 'name' ? 'primary' : 'secondary'} size="sm" onClick={() => updateParam('sort', 'name')}>
                  По названию
                </Button>
                <Button variant={sort === 'price' ? 'primary' : 'secondary'} size="sm" onClick={() => updateParam('sort', 'price')}>
                  По цене
                </Button>
              </Row>
            }
            chipsSlot={
              <Row gap="sm" wrap align="center" aria-label="Активные фильтры">
                <SelectedCategoryChips items={selectedCategoryItems} mode={categoryMode} onToggle={(id) => toggleGroup(Number(id))} />
                {sellerIds.length > 0 && <Chip onClick={() => updateParam('seller_id', null)}>Продавцы: {sellerIds.join(', ')} ×</Chip>}
                {stateIds.map((id) => (
                  <Chip key={id} selected onClick={() => toggleState(id)}>
                    {stateFilterLabel(id)} ×
                  </Chip>
                ))}
              </Row>
            }
          />
        )}
      </Stack>

      {state.status === 'loading' && (
        <Grid gap="md" aria-label="Загрузка каталога">
          {Array.from({ length: 6 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </Grid>
      )}

      {state.status === 'error' && (
        <ErrorState
          title={state.title ?? 'Не удалось загрузить каталог'}
          description={state.message}
          action={<Button onClick={load}>Повторить</Button>}
        />
      )}

      {state.status === 'ready' && state.products.length === 0 && (
        <EmptyState
          title="Ничего не найдено"
          description="Попробуйте изменить запрос или категорию"
        />
      )}

      {state.status === 'ready' && state.products.length > 0 && (
        <>
          <Grid gap="md">
            {state.products.map((p) => (
              <ProductCard
                key={p.key}
                product={p}
                onOpen={(product) => {
                  const productId = Number(product.id);
                  trackEvent(isStore ? 'store_product_select' : 'catalog_product_select', {
                    screen: analyticsScreen,
                    product_id: Number.isFinite(productId) ? productId : undefined,
                    seller_id: storeId ? Number(storeId) : undefined,
                  });
                  navigate(productRoute(product));
                }}
              />
            ))}
          </Grid>

          {Math.max(1, Math.ceil(state.total / state.limit)) > 1 && (
            <Row gap="sm" justify="center" data-testid="catalog-pagination">
              <Button
                variant="secondary"
                size="sm"
                disabled={state.page <= 1}
                onClick={() => updateParam('page', String(state.page - 1))}
              >
                Назад
              </Button>
              <Text tone="secondary">
                Стр. {state.page} из {Math.max(1, Math.ceil(state.total / state.limit))}
              </Text>
              <Button
                variant="secondary"
                size="sm"
                disabled={state.page * state.limit >= state.total}
                onClick={() => updateParam('page', String(state.page + 1))}
              >
                Вперёд
              </Button>
            </Row>
          )}
        </>
      )}
    </Stack>
  );
}
