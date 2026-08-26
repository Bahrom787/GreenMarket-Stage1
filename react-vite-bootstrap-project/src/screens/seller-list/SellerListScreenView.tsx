import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Content, Header, Row, Stack } from '@/layout';
import { Avatar, Button, EmptyState, ErrorState, ListItem, Loader, Text } from '@/design-system/components';
import { CatalogApiError, fetchSellers } from '@/buyer_mvp/api';
import { toBuyerSellerListRow, type BuyerSellerListRow } from '@/buyer_mvp/sellerListPresentation';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; sellers: BuyerSellerListRow[] };

const SEARCH_DEBOUNCE_MS = 300;

export function SellerListScreenView() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get('search') ?? '';
  const [searchInput, setSearchInput] = useState(search);
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const requestSeq = useRef(0);

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

  useEffect(() => setSearchInput(search), [search]);

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

  return (
    <div data-testid="seller-list-screen" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Header>
        <Row gap="lg" align="center" justify="between" wrap style={{ width: '100%' }}>
          <Stack gap="xs">
            <Text variant="title" as="h1">
              Список продавцов
            </Text>
            {state.status === 'ready' && (
              <Text variant="caption" tone="secondary" data-testid="seller-list-count">
                {count} продавцов
              </Text>
            )}
          </Stack>
          <form onSubmit={(e) => e.preventDefault()} role="search" style={{ width: 'min(100%, 360px)' }}>
            <input
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Найти продавца"
              aria-label="Поиск продавца"
              data-testid="seller-list-search"
              className="gm-focusable"
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
        </Row>
      </Header>

      <Content style={{ overflowY: 'auto' }}>
        {state.status === 'loading' && (
          <Stack gap="lg" align="center" style={{ padding: 'var(--space-xxl) 0' }} data-testid="seller-list-loading">
            <Loader />
            <Text tone="secondary">Загружаем продавцов...</Text>
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
                onClick={() => navigate(`/seller/${seller.sellerId}`)}
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
