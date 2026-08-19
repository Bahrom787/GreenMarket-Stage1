import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Text, ErrorState, EmptyState, Button } from '@/design-system/components';
import { Grid, Stack, Row } from '@/layout';
import { fetchProducts, fetchSeller, fetchSellerProducts, CatalogApiError } from '../api';
import { SearchBar } from '../components/SearchBar';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import { globalCatalogContext, isStoreContext, productPath, type CatalogContext } from '../catalogContext';
import { toGlobalProductCard, toStoreProductCard, type CatalogProductCardViewModel } from '../catalogPresentation';
import type { CatalogQuery, SortOrder } from '../types';

type LoadState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | ({ status: 'ready' } & ReadyPayload);

type ReadyPayload = {
  title: string;
  subtitle?: string;
  products: CatalogProductCardViewModel[];
  page: number;
  limit: number;
  total: number;
};

/** Экран 2 (Buyer_MVP.md): список товаров, поиск, фильтр по категории. */
interface CatalogScreenProps {
  context?: CatalogContext;
}

export function CatalogScreen({ context = globalCatalogContext }: CatalogScreenProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  const search = searchParams.get('search') ?? '';
  const groupId = searchParams.get('group_id');
  const sort = (searchParams.get('sort') as SortOrder | null) ?? 'name';
  const page = Number(searchParams.get('page') ?? '1');
  const isStore = isStoreContext(context);
  const storeId = isStore ? context.storeId : undefined;

  function load() {
    const query: CatalogQuery = {
      search: search || undefined,
      groupId: groupId ? Number(groupId) : undefined,
      sort,
      page,
    };

    setState({ status: 'loading' });
    const request: Promise<ReadyPayload> = isStore
      ? Promise.all([fetchSeller(storeId ?? ''), fetchSellerProducts(storeId ?? '', query)]).then(([seller, res]) => ({
          title: seller.name,
          subtitle: seller.market?.name,
          products: res.products.map(toStoreProductCard),
          page: res.page,
          limit: res.limit,
          total: res.total,
        }))
      : fetchProducts(query).then((res) => ({
          title: 'Каталог',
          products: res.products.map(toGlobalProductCard),
          page: res.page,
          limit: res.limit,
          total: res.total,
        }));

    request
      .then((res) =>
        setState({
          status: 'ready',
          title: res.title,
          subtitle: res.subtitle,
          products: res.products,
          page: res.page,
          limit: res.limit,
          total: res.total,
        }),
      )
      .catch((err: unknown) => {
        const message = err instanceof CatalogApiError ? err.message : 'Не удалось загрузить товары.';
        setState({ status: 'error', message });
      });
  }

  useEffect(load, [search, groupId, sort, page, isStore, storeId]);

  function updateParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== 'page') next.delete('page');
    setSearchParams(next);
  }

  return (
    <Stack gap="lg">
      <Row align="center" justify="between">
        <Stack gap="xs">
          <Text variant="headline" as="h1">
            {state.status === 'ready' ? state.title : isStore ? 'Каталог магазина' : 'Каталог'}
          </Text>
          {state.status === 'ready' && state.subtitle && <Text tone="secondary">{state.subtitle}</Text>}
        </Stack>
        {isStore && (
          <Button variant="secondary" size="sm" onClick={() => navigate('/')}>
            В общий каталог
          </Button>
        )}
      </Row>

      <SearchBar initialValue={search} onSearch={(value) => updateParam('search', value || null)} />

      <Row gap="sm" wrap>
        <Button variant={sort === 'name' ? 'primary' : 'secondary'} size="sm" onClick={() => updateParam('sort', 'name')}>
          По названию
        </Button>
        <Button variant={sort === 'price' ? 'primary' : 'secondary'} size="sm" onClick={() => updateParam('sort', 'price')}>
          По цене
        </Button>
        {groupId && (
          <Button variant="ghost" size="sm" onClick={() => updateParam('group_id', null)}>
            Сбросить категорию
          </Button>
        )}
      </Row>

      {state.status === 'loading' && (
        <Grid gap="md" aria-label="Загрузка каталога">
          {Array.from({ length: 6 }, (_, index) => (
            <ProductCardSkeleton key={index} />
          ))}
        </Grid>
      )}

      {state.status === 'error' && (
        <ErrorState title="Не удалось загрузить каталог" description={state.message} action={<Button onClick={load}>Повторить</Button>} />
      )}

      {state.status === 'ready' && state.products.length === 0 && (
        <EmptyState title="Ничего не найдено" description="Попробуйте изменить запрос или категорию" />
      )}

      {state.status === 'ready' && state.products.length > 0 && (
        <>
          <Grid gap="md">
            {state.products.map((p) => (
              <ProductCard key={p.key} product={p} onOpen={(id) => navigate(productPath(context, id))} />
            ))}
          </Grid>

          <Row gap="sm" justify="center">
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
        </>
      )}
    </Stack>
  );
}
