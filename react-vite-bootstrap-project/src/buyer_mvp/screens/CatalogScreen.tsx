import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Text, ErrorState, EmptyState, Button, Chip } from '@/design-system/components';
import { Grid, Stack, Row } from '@/layout';
import { fetchProducts, fetchSeller, fetchSellerProducts, fetchGroups, CatalogApiError } from '../api';
import { SearchBar } from '../components/SearchBar';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
import {
  globalCatalogContext,
  isStoreContext,
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
  catalogGroupId,
  catalogGroupOptionLabel,
  catalogGroupOptions,
  catalogPage,
  catalogSort,
  clearCatalogSearchParams,
  selectedCatalogGroup,
  updateCatalogSearchParams,
  type CatalogParam,
} from '../catalogUrlState';
import type { CatalogQuery, ProductGroup } from '../types';

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

type GroupsState =
  | { status: 'loading'; groups: ProductGroup[] }
  | { status: 'error'; groups: ProductGroup[]; message: string }
  | { status: 'ready'; groups: ProductGroup[] };

/** Экран 2 (Buyer_MVP.md): список товаров, поиск, фильтр по категории. */
interface CatalogScreenProps {
  context?: CatalogContext;
}

export function CatalogScreen({ context = globalCatalogContext }: CatalogScreenProps) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [groupsState, setGroupsState] = useState<GroupsState>({ status: 'loading', groups: [] });
  const catalogRequestId = useRef(0);

  const search = searchParams.get('search') ?? '';
  const groupId = searchParams.get('group_id');
  const parsedGroupId = catalogGroupId(groupId);
  const sort = catalogSort(searchParams.get('sort'));
  const page = catalogPage(searchParams.get('page'));
  const isStore = isStoreContext(context);
  const storeId = isStore ? context.storeId : undefined;
  const groups = catalogGroupOptions(groupsState.groups);
  const selectedGroup = selectedCatalogGroup(groupsState.groups, groupId);
  const hasFilters = Boolean(search || groupId || sort !== 'name' || page !== 1);

  function load() {
    const requestId = catalogRequestId.current + 1;
    catalogRequestId.current = requestId;
    const query: CatalogQuery = {
      search: search || undefined,
      groupId: parsedGroupId,
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
        const message =
          err instanceof CatalogApiError ? err.message : 'Не удалось загрузить товары.';
        setState({ status: 'error', message });
      });
  }

  useEffect(load, [search, groupId, parsedGroupId, sort, page, isStore, storeId]);

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

  function updateParam(key: CatalogParam, value: string | null) {
    setSearchParams(updateCatalogSearchParams(searchParams, key, value));
  }

  function clearFilters() {
    setSearchParams(clearCatalogSearchParams());
  }

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
      <Row align="center" justify="between">
        <Stack gap="xs">
          <Text variant="headline" as="h1">
            {state.status === 'ready' ? state.title : isStore ? 'Каталог магазина' : 'Каталог'}
          </Text>
          {state.status === 'ready' && state.subtitle && (
            <Text tone="secondary">{state.subtitle}</Text>
          )}
        </Stack>
        {isStore && storeId && (
          <Row gap="sm" wrap>
            <Button variant="secondary" size="sm" onClick={() => navigate(storeHomePath(storeId))}>
              О магазине
            </Button>
          </Row>
        )}
      </Row>

      <Stack gap="sm" className="gm-catalog-filters">
        <SearchBar initialValue={search} onSearch={(value) => updateParam('search', value || null)} />

        <Row gap="sm" wrap align="center">
          <label className="gm-catalog-filter">
            <Text variant="caption" as="span">
              Категория
            </Text>
            <select
              className="gm-catalog-filter__select gm-focusable"
              value={groupId ?? ''}
              onChange={(event) => updateParam('group_id', event.target.value || null)}
              disabled={groupsState.status === 'loading' && groups.length === 0}
              aria-label="Категория"
            >
              <option value="">Все категории</option>
              {groups.map(({ group, depth }) => (
                <option key={group.id} value={group.id}>
                  {catalogGroupOptionLabel({ group, depth })}
                </option>
              ))}
            </select>
          </label>
          {groupsState.status === 'loading' && <Text tone="secondary">Категории загружаются</Text>}
          {groupsState.status === 'error' && <Text tone="secondary">{groupsState.message}</Text>}
        </Row>

        <Row gap="sm" wrap>
        <Button
          variant={sort === 'name' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => updateParam('sort', 'name')}
        >
          По названию
        </Button>
        <Button
          variant={sort === 'price' ? 'primary' : 'secondary'}
          size="sm"
          onClick={() => updateParam('sort', 'price')}
        >
          По цене
        </Button>
        {groupId && (
          <Button variant="ghost" size="sm" onClick={() => updateParam('group_id', null)}>
            Сбросить категорию
          </Button>
        )}
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Очистить фильтры
            </Button>
          )}
        </Row>

        <Row gap="sm" wrap align="center" aria-label="Активные фильтры">
          {search && <Chip onClick={() => updateParam('search', null)}>Поиск: {search} ×</Chip>}
          {selectedGroup && (
            <Chip selected onClick={() => updateParam('group_id', null)}>
              {selectedGroup.name} ×
            </Chip>
          )}
          {!search && !selectedGroup && <Text tone="secondary">Фильтры не применены</Text>}
        </Row>
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
          title="Не удалось загрузить каталог"
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
                onOpen={(product) => navigate(productRoute(product))}
              />
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
