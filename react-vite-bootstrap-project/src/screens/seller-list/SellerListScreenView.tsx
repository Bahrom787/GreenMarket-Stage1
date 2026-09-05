import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Content, Header, Row, Stack } from '@/layout';
import { Avatar, Button, Chip, EmptyState, ErrorState, ListItem, Text } from '@/design-system/components';
import { CatalogApiError, fetchGroups, fetchSellers } from '@/buyer_mvp/api';
import { toBuyerSellerListRow, type BuyerSellerListRow } from '@/buyer_mvp/sellerListPresentation';
import {
  catalogGroupIds,
  catalogGroupOptionLabel,
  catalogGroupOptions,
  catalogSellerIds,
  catalogStateIds,
  toggleCatalogGroupParam,
  toggleCatalogStateParam,
} from '@/buyer_mvp/catalogUrlState';
import type { ProductGroup } from '@/buyer_mvp/types';
import { trackEvent } from '@/shared/analytics/AnalyticsReporter';
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
import './seller-list.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; sellers: BuyerSellerListRow[] };

type GroupsState =
  | { status: 'loading'; groups: ProductGroup[] }
  | { status: 'error'; groups: ProductGroup[]; message: string }
  | { status: 'ready'; groups: ProductGroup[] };

const SEARCH_DEBOUNCE_MS = 300;

export function SellerListScreenView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const parsedGroupIds = useMemo(() => catalogGroupIds(searchParams.get('group_id')), [searchParams]);
  const parsedSellerIds = useMemo(() => catalogSellerIds(searchParams.get('seller_id')), [searchParams]);
  const parsedStateIds = useMemo(() => catalogStateIds(searchParams.get('state')), [searchParams]);
  const selectedCategoryIds = useMemo(() => parsedGroupIds ?? [], [parsedGroupIds]);
  const selectedSellerIds = useMemo(() => parsedSellerIds ?? [], [parsedSellerIds]);
  const selectedStateIds = useMemo(() => (parsedStateIds ?? []) as StateFilterId[], [parsedStateIds]);
  const selectedCategoryIdSet = useMemo(() => new Set(selectedCategoryIds), [selectedCategoryIds]);
  const selectedSellerIdSet = useMemo(() => new Set(selectedSellerIds.map(String)), [selectedSellerIds]);
  const [searchInput, setSearchInput] = useState(search);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [groupsState, setGroupsState] = useState<GroupsState>({ status: 'loading', groups: [] });
  const [categoryMode, setCategoryMode] = useState<CategoryPanelMode>('text');
  const [autoCollapseCategories, setAutoCollapseCategories] = useState(true);
  const [filterActivity, setFilterActivity] = useState(0);
  const requestSeq = useRef(0);
  const restoredStoredFilters = useRef(false);
  const skipStoredFiltersSave = useRef(false);

  const loadSellers = useCallback(() => {
    const seq = ++requestSeq.current;
    setState({ status: 'loading' });
    fetchSellers({ search: search || undefined })
      .then((res) => {
        if (seq !== requestSeq.current) return;
        setState({ status: 'ready', sellers: res.sellers.map(toBuyerSellerListRow) });
      })
      .catch((err: unknown) => {
        if (seq !== requestSeq.current) return;
        setState({
          status: 'error',
          message:
            err instanceof CatalogApiError
              ? err.message
              : 'Не удалось загрузить список продавцов.',
        });
      });
  }, [search]);

  useEffect(loadSellers, [loadSellers]);

  useEffect(() => {
    let active = true;
    setGroupsState((current) => ({ status: 'loading', groups: current.groups }));
    fetchGroups()
      .then((res) => {
        if (active) setGroupsState({ status: 'ready', groups: res.groups });
      })
      .catch((err: unknown) => {
        if (!active) return;
        setGroupsState((current) => ({
          status: 'error',
          groups: current.groups,
          message: err instanceof CatalogApiError ? err.message : 'Не удалось загрузить категории.',
        }));
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    trackEvent('seller_list_open');
  }, []);

  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    if (restoredStoredFilters.current) return;
    restoredStoredFilters.current = true;
    if (searchParams.toString()) return;
    const stored = loadStoredSearchFilters();
    if (!stored.search && !stored.categoryIds.length && !stored.sellerIds.length && !stored.stateIds.length) return;
    const next = new URLSearchParams(searchParams);
    if (stored.search) next.set('search', stored.search);
    if (stored.categoryIds.length) next.set('group_id', stored.categoryIds.join(','));
    if (stored.sellerIds.length) next.set('seller_id', stored.sellerIds.join(','));
    if (stored.stateIds.length) next.set('state', stored.stateIds.join(','));
    skipStoredFiltersSave.current = true;
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (skipStoredFiltersSave.current) {
      skipStoredFiltersSave.current = false;
      return;
    }
    saveStoredSearchFilters({ categoryIds: selectedCategoryIds, sellerIds: selectedSellerIds, stateIds: selectedStateIds, search });
  }, [search, selectedCategoryIds, selectedSellerIds, selectedStateIds]);

  useEffect(() => {
    const value = searchInput.trim();
    if (value === search) return;
    const timer = window.setTimeout(() => {
      const next = new URLSearchParams(searchParams);
      if (value) next.set('search', value);
      else next.delete('search');
      setSearchParams(next);
    }, SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [search, searchInput, searchParams, setSearchParams]);

  const isSearchActive = search.trim().length > 0;
  const count = state.status === 'ready' ? state.sellers.length : 0;
  const categoryItems = catalogGroupOptions(groupsState.groups).map(({ group, depth }) => ({
    id: group.id,
    name: group.name,
    depth,
    label: catalogGroupOptionLabel({ group, depth }),
    selected: selectedCategoryIdSet.has(group.id),
  }));
  const selectedCategoryItems = categoryItems.filter((item) => item.selected);
  const sellerItems = state.status === 'ready' ? state.sellers.map((seller) => ({ id: seller.sellerId, name: seller.name, selected: selectedSellerIdSet.has(seller.sellerId) })) : [];
  const selectedCount = selectedSellerIds.length;
  const emptyCopy = useMemo(
    () =>
      isSearchActive
        ? {
            title: 'Ничего не найдено',
            description: `По запросу «${search.trim()}» продавцы не найдены.`,
          }
        : {
            title: 'Продавцы не найдены',
            description: 'Пока в каталоге нет ни одного продавца.',
          },
    [isSearchActive, search],
  );

  function setSelectedCategoryIds(ids: number[]) {
    const next = new URLSearchParams(searchParams);
    if (ids.length) next.set('group_id', ids.join(','));
    else next.delete('group_id');
    setSearchParams(next);
  }

  function setSelectedSellerIds(ids: number[]) {
    const next = new URLSearchParams(searchParams);
    if (ids.length) next.set('seller_id', ids.join(','));
    else next.delete('seller_id');
    setSearchParams(next);
  }

  function clearSellerFilters() {
    clearStoredSearchFilters();
    const next = new URLSearchParams(searchParams);
    next.delete('search');
    next.delete('group_id');
    next.delete('seller_id');
    next.delete('state');
    next.delete('filter');
    setSearchParams(next);
  }

  function toggleCategory(categoryId: number) {
    const next = toggleCatalogGroupParam(selectedCategoryIds, categoryId);
    setSelectedCategoryIds(next ? next.split(',').map(Number) : []);
    setFilterActivity((value) => value + 1);
    trackEvent('catalog_category_select', { screen: 'SellerList', category_id: categoryId });
  }

  function toggleSeller(sellerId: string) {
    const id = Number(sellerId);
    if (!Number.isInteger(id) || id <= 0) return;
    const nextIds = selectedSellerIdSet.has(sellerId) ? selectedSellerIds.filter((item) => item !== id) : [...selectedSellerIds, id];
    setSelectedSellerIds(nextIds);
    trackEvent('seller_select', { seller_id: id, selected_count: nextIds.length });
  }

  function toggleState(stateId: StateFilterId) {
    const next = new URLSearchParams(searchParams);
    const value = toggleCatalogStateParam(selectedStateIds, stateId);
    if (value) next.set('state', value);
    else next.delete('state');
    setSearchParams(next);
    trackEvent('seller_filter_applied', { filter: stateId });
  }

  function showProducts() {
    trackEvent('seller_products_open', { selected_count: selectedSellerIds.length });
    if (selectedSellerIds.length) {
      trackEvent('seller_filter_applied', { selected_count: selectedSellerIds.length });
      trackEvent('seller_filter_catalog_open', { selected_count: selectedSellerIds.length });
    }
    const next = new URLSearchParams();
    if (search) next.set('search', search);
    if (selectedCategoryIds.length) next.set('group_id', selectedCategoryIds.join(','));
    if (selectedSellerIds.length) next.set('seller_id', selectedSellerIds.join(','));
    if (selectedStateIds.length) next.set('state', selectedStateIds.join(','));
    const storedSort = loadStoredSearchFilters().sort;
    if (storedSort !== 'name') next.set('sort', storedSort);
    navigate(next.toString() ? `/?${next.toString()}` : '/');
  }

  return (
    <div data-testid="seller-list-screen" className="gm-seller-list-screen">
      <Header>
        <SearchFilterBar
          searchSlot={
            <form className="gm-buyer-search" onSubmit={(e) => e.preventDefault()} role="search">
              <span className="gm-buyer-search__icon" aria-hidden="true" />
              <input
                className="gm-buyer-search__input"
                type="search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Найти продавца"
                aria-label="Поиск продавца"
                data-testid="seller-list-search"
              />
            </form>
          }
          groups={[
            {
              id: 'categories',
              label: 'Категории',
              count: selectedCategoryItems.length,
              testId: 'seller-list-category-toggle',
              ariaLabel: `Категории, выбрано ${selectedCategoryItems.length}`,
              triggerContent: <CategoryToggleContent mode={categoryMode} count={selectedCategoryItems.length} />,
              panel: (
                <CategoryFilter
                  items={categoryItems}
                  mode={categoryMode}
                  autoCollapse={autoCollapseCategories}
                  onModeChange={setCategoryMode}
                  onAutoCollapseChange={setAutoCollapseCategories}
                  onToggle={(id) => toggleCategory(Number(id))}
                  onInteract={() => setFilterActivity((value) => value + 1)}
                  loading={groupsState.status === 'loading'}
                  error={groupsState.status === 'error' ? groupsState.message : undefined}
                  testIdPrefix="seller-list"
                />
              ),
            },
            {
              id: 'sellers',
              label: 'Продавцы',
              count: selectedCount,
              panel: (
                <SellerFilter
                  items={sellerItems}
                  status={state.status === 'error' ? 'error' : state.status}
                  error={state.status === 'error' ? state.message : undefined}
                  onToggle={toggleSeller}
                  testId="seller-list-filter-panel"
                />
              ),
            },
            {
              id: 'state',
              label: 'Состояние',
              count: selectedStateIds.length,
              testId: 'seller-list-state-toggle',
              ariaLabel: `Состояние, выбрано ${selectedStateIds.length}`,
              panel: (
                <StateFilter
                  selected={selectedStateIds}
                  onToggle={toggleState}
                  testId="seller-list-state-filter"
                />
              ),
            },
          ]}
          openGroupId={searchParams.get('filter')}
          onOpenGroupChange={(id) => {
            const next = new URLSearchParams(searchParams);
            if (id) next.set('filter', id);
            else next.delete('filter');
            setSearchParams(next);
          }}
          autoCollapseMs={7000}
          autoCollapseEnabled={autoCollapseCategories}
          activityKey={filterActivity}
          hasFilters={Boolean(search || selectedCategoryIds.length > 0 || selectedCount > 0 || selectedStateIds.length > 0)}
          onClearFilters={clearSellerFilters}
          chipsSlot={
            <Row gap="sm" wrap align="center" aria-label="Активные фильтры">
              <SelectedCategoryChips items={selectedCategoryItems} mode={categoryMode} onToggle={(id) => toggleCategory(Number(id))} />
              {selectedStateIds.map((id) => (
                <Chip key={id} selected onClick={() => toggleState(id)}>
                  {stateFilterLabel(id)} ×
                </Chip>
              ))}
            </Row>
          }
          actionsSlot={
            <>
              <Text variant="caption" tone="secondary" data-testid="seller-list-count">
                {state.status === 'ready' ? `${count} продавцов` : 'Загрузка продавцов'}
                {selectedCount > 0 ? `, выбрано: ${selectedCount}` : ''}
              </Text>
              <Button onClick={showProducts} size="sm" data-testid="seller-list-show-products">
                Показать товары{selectedCount > 0 ? ` (${selectedCount})` : ''}
              </Button>
            </>
          }
        />
      </Header>

      <Content style={{ overflowY: 'auto' }}>
        {state.status === 'loading' && (
          <Stack gap="none" data-testid="seller-list-loading">
            {Array.from({ length: 4 }, (_, index) => (
              <ListItem
                key={index}
                static
                leading={<span className="gm-seller-list-skeleton__avatar" />}
                trailing={<span className="gm-seller-list-skeleton__pill" />}
              >
                <Stack gap="xs">
                  <span className="gm-seller-list-skeleton__line gm-seller-list-skeleton__line--title" />
                  <span className="gm-seller-list-skeleton__line" />
                  <span className="gm-seller-list-skeleton__line gm-seller-list-skeleton__line--short" />
                </Stack>
              </ListItem>
            ))}
          </Stack>
        )}

        {state.status === 'error' && (
          <ErrorState
            title="Не удалось загрузить список продавцов"
            description={state.message}
            action={
              <Button variant="secondary" onClick={loadSellers}>
                Повторить
              </Button>
            }
          />
        )}

        {state.status === 'ready' && state.sellers.length === 0 && (
          <EmptyState title={emptyCopy.title} description={emptyCopy.description} />
        )}

        {state.status === 'ready' && state.sellers.length > 0 && (
          <Stack gap="none">
            {state.sellers.map((seller) => (
              <ListItem
                key={seller.sellerId}
                leading={<Avatar initials={seller.initials} alt={`${seller.name}: аватар`} />}
                selected={selectedSellerIdSet.has(seller.sellerId)}
                onClick={() => toggleSeller(seller.sellerId)}
                trailing={<Text variant="caption" as="span">{selectedSellerIdSet.has(seller.sellerId) ? 'Выбран' : 'Выбрать'}</Text>}
                data-testid={`seller-list-row-${seller.sellerId}`}
              >
                <Stack gap="xs">
                  <Text variant="bodyStrong">{seller.name}</Text>
                  {seller.description && (
                    <Text variant="caption" tone="secondary">
                      {seller.description}
                    </Text>
                  )}
                  {seller.market && (
                    <Text variant="caption" tone="secondary">
                      {seller.market}
                    </Text>
                  )}
                  {seller.place && (
                    <Text variant="caption" tone="secondary">
                      {seller.place}
                    </Text>
                  )}
                  {seller.workingHours && (
                    <Text variant="caption" tone="secondary">
                      {seller.workingHours}
                    </Text>
                  )}
                </Stack>
              </ListItem>
            ))}
          </Stack>
        )}
      </Content>
    </div>
  );
}
