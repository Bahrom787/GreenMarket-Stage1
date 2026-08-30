import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Content, Header, Stack } from '@/layout';
import { Avatar, Button, EmptyState, ErrorState, ListItem, Text } from '@/design-system/components';
import { CatalogApiError, fetchSellers } from '@/buyer_mvp/api';
import { toBuyerSellerListRow, type BuyerSellerListRow } from '@/buyer_mvp/sellerListPresentation';
import { catalogSellerIds } from '@/buyer_mvp/catalogUrlState';
import { trackEvent } from '@/shared/analytics/AnalyticsReporter';
import { SearchFilterBar } from '@/components/search-filter/SearchFilterBar';
import { loadStoredSearchFilters, saveStoredSearchFilters } from '@/components/search-filter/filterStorage';
import './seller-list.css';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; sellers: BuyerSellerListRow[] };

const SEARCH_DEBOUNCE_MS = 300;

export function SellerListScreenView() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const parsedSellerIds = useMemo(() => catalogSellerIds(searchParams.get('seller_id')), [searchParams]);
  const selectedSellerIds = useMemo(() => parsedSellerIds ?? [], [parsedSellerIds]);
  const selectedSellerIdSet = useMemo(() => new Set(selectedSellerIds.map(String)), [selectedSellerIds]);
  const [searchInput, setSearchInput] = useState(search);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
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
    trackEvent('seller_list_open');
  }, []);

  useEffect(() => setSearchInput(search), [search]);

  useEffect(() => {
    if (restoredStoredFilters.current) return;
    restoredStoredFilters.current = true;
    if (location.key !== 'default') return;
    if (searchParams.has('seller_id')) return;
    const stored = loadStoredSearchFilters();
    if (!stored.sellerIds.length) return;
    const next = new URLSearchParams(searchParams);
    next.set('seller_id', stored.sellerIds.join(','));
    skipStoredFiltersSave.current = true;
    setSearchParams(next, { replace: true });
  }, [location.key, searchParams, setSearchParams]);

  useEffect(() => {
    if (skipStoredFiltersSave.current) {
      skipStoredFiltersSave.current = false;
      return;
    }
    saveStoredSearchFilters({ sellerIds: selectedSellerIds });
  }, [selectedSellerIds]);

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

  function setSelectedSellerIds(ids: number[]) {
    const next = new URLSearchParams(searchParams);
    if (ids.length) next.set('seller_id', ids.join(','));
    else next.delete('seller_id');
    setSearchParams(next);
  }

  function clearSellerFilters() {
    const next = new URLSearchParams(searchParams);
    next.delete('seller_id');
    next.delete('filter');
    setSearchParams(next);
  }

  function toggleSeller(sellerId: string) {
    const id = Number(sellerId);
    if (!Number.isInteger(id) || id <= 0) return;
    const nextIds = selectedSellerIdSet.has(sellerId) ? selectedSellerIds.filter((item) => item !== id) : [...selectedSellerIds, id];
    setSelectedSellerIds(nextIds);
    trackEvent('seller_select', { seller_id: id, selected_count: nextIds.length });
  }

  function showProducts() {
    trackEvent('seller_products_open', { selected_count: selectedSellerIds.length });
    if (selectedSellerIds.length) {
      trackEvent('seller_filter_applied', { selected_count: selectedSellerIds.length });
      trackEvent('seller_filter_catalog_open', { selected_count: selectedSellerIds.length });
    }
    navigate(selectedSellerIds.length ? `/?seller_id=${selectedSellerIds.join(',')}` : '/');
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
              id: 'sellers',
              label: 'Продавцы',
              count: selectedCount,
              panel: (
                <Stack gap="xs" data-testid="seller-list-filter-panel">
                  {state.status === 'ready' &&
                    state.sellers.map((seller) => (
                      <label key={seller.sellerId} className="gm-seller-list-filter-option">
                        <input
                          type="checkbox"
                          checked={selectedSellerIdSet.has(seller.sellerId)}
                          onChange={() => toggleSeller(seller.sellerId)}
                        />
                        <span>{seller.name}</span>
                      </label>
                    ))}
                  {state.status === 'loading' && <Text tone="secondary">Загрузка продавцов</Text>}
                  {state.status === 'ready' && state.sellers.length === 0 && <Text tone="secondary">Продавцы не найдены</Text>}
                </Stack>
              ),
            },
          ]}
          openGroupId={searchParams.get('filter') === 'sellers' ? 'sellers' : null}
          onOpenGroupChange={(id) => {
            const next = new URLSearchParams(searchParams);
            if (id) next.set('filter', id);
            else next.delete('filter');
            setSearchParams(next);
          }}
          hasFilters={selectedCount > 0}
          onClearFilters={clearSellerFilters}
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
