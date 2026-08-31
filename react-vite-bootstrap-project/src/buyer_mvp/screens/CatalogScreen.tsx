import { type CSSProperties, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { Text, ErrorState, EmptyState, Button, Chip } from '@/design-system/components';
import { Grid, Stack, Row } from '@/layout';
import { fetchProducts, fetchSeller, fetchSellerProducts, fetchGroups, CatalogApiError } from '../api';
import { SearchBar } from '../components/SearchBar';
import { ProductCard, ProductCardSkeleton } from '../components/ProductCard';
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
  catalogGroupOptionLabel,
  catalogGroupOptions,
  catalogPage,
  catalogSort,
  clearCatalogSearchParams,
  selectedCatalogGroups,
  toggleCatalogGroupParam,
  updateCatalogSearchParams,
  type CatalogParam,
} from '../catalogUrlState';
import type { CatalogQuery, ProductGroup } from '../types';

type CategoryPanelMode = 'text' | 'icons';

const categoryIconRules: Array<{ test: RegExp; kind: string }> = [
  { test: /овощ|vegetable|огур|помид|карто/i, kind: 'vegetables' },
  { test: /зелень|салат|green|salad/i, kind: 'greens' },
  { test: /фрукт|fruit|яблок|груш/i, kind: 'fruit' },
  { test: /ягод|berr/i, kind: 'berries' },
  { test: /орех|nut/i, kind: 'nuts' },
  { test: /слад|восточ|sweet/i, kind: 'sweets' },
  { test: /сухофрукт|цукат|dried/i, kind: 'dried' },
  { test: /солень|маринад|pickle/i, kind: 'pickles' },
  { test: /бакале|проч|grocery/i, kind: 'grocery' },
];

function categoryIconKind(name: string) {
  return categoryIconRules.find((rule) => rule.test.test(name))?.kind ?? 'grocery';
}

function CategoryIcon({ kind }: { kind: string }) {
  return (
    <span
      aria-hidden="true"
      className={`gm-catalog-category-icon gm-catalog-category-icon--${kind}`}
    />
  );
}

function CategoryToggleContent({ mode, count }: { mode: CategoryPanelMode; count: number }) {
  return (
    <>
      <CategoryIcon kind="grocery" />
      {mode === 'text' && <span>Категории</span>}
      {count > 0 && <span>{mode === 'text' ? `(${count})` : count}</span>}
    </>
  );
}

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
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categoryMode, setCategoryMode] = useState<CategoryPanelMode>('text');
  const [autoCollapseCategories, setAutoCollapseCategories] = useState(true);
  const [categoryPanelActivity, setCategoryPanelActivity] = useState(0);
  const catalogRequestId = useRef(0);

  const search = searchParams.get('search') ?? '';
  const groupId = searchParams.get('group_id');
  const sellerId = searchParams.get('seller_id');
  const parsedGroupIds = useMemo(() => catalogGroupIds(groupId), [groupId]);
  const parsedSellerIds = useMemo(() => catalogSellerIds(sellerId), [sellerId]);
  const groupIds = useMemo(() => parsedGroupIds ?? [], [parsedGroupIds]);
  const sellerIds = useMemo(() => parsedSellerIds ?? [], [parsedSellerIds]);
  const hasInvalidGroupId = Boolean(groupId && !parsedGroupIds);
  const hasInvalidSellerId = Boolean(sellerId && !parsedSellerIds);
  const sort = catalogSort(searchParams.get('sort'));
  const page = catalogPage(searchParams.get('page'));
  const isStore = isStoreContext(context);
  const storeId = isStore ? context.storeId : undefined;
  const groups = catalogGroupOptions(groupsState.groups);
  const categoryItems = groups.map(({ group, depth }) => ({
    group,
    depth,
    iconKind: categoryIconKind(group.name),
    label: catalogGroupOptionLabel({ group, depth }),
    selected: groupIds.includes(group.id),
  }));
  const selectedCategoryItems = categoryItems.filter((item) => item.selected);
  const selectedGroups = selectedCatalogGroups(groupsState.groups, groupIds);
  const selectedGroupIds = new Set(groupIds);
  const hasFilters = Boolean(search || groupIds.length || sellerIds.length || hasInvalidGroupId || hasInvalidSellerId || sort !== 'name' || page !== 1);

  function load() {
    const requestId = catalogRequestId.current + 1;
    catalogRequestId.current = requestId;

    if (hasInvalidGroupId || hasInvalidSellerId) {
      setState({ status: 'error', message: hasInvalidGroupId ? 'Некорректный параметр категории.' : 'Некорректный параметр продавца.' });
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

  useEffect(load, [search, groupIds, sellerIds, sort, page, isStore, storeId, hasInvalidGroupId, hasInvalidSellerId]);

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

  function toggleGroup(groupId: number) {
    updateParam('group_id', toggleCatalogGroupParam(groupIds, groupId));
    setCategoryPanelActivity((value) => value + 1);
  }

  function toggleCategoriesOpen() {
    setCategoriesOpen((open) => !open);
    setCategoryPanelActivity((value) => value + 1);
  }

  function touchCategoryPanel() {
    setCategoryPanelActivity((value) => value + 1);
  }

  useEffect(() => {
    if (isStore || !categoriesOpen || !autoCollapseCategories) return;
    const timer = window.setTimeout(() => setCategoriesOpen(false), 7000);
    return () => window.clearTimeout(timer);
  }, [isStore, categoriesOpen, autoCollapseCategories, categoryPanelActivity]);

  useEffect(() => {
    if (isStore || !categoriesOpen) return;
    const collapse = () => setCategoriesOpen(false);
    window.addEventListener('scroll', collapse, { passive: true });
    return () => window.removeEventListener('scroll', collapse);
  }, [isStore, categoriesOpen]);

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
        <div className={`gm-catalog-search-row gm-catalog-search-row--${categoryMode}`}>
          {!isStore && categoryMode === 'icons' && (
            <Button
              variant="secondary"
              size="sm"
              aria-label={`Категории, выбрано ${selectedCategoryItems.length}`}
              aria-controls="catalog-category-list"
              aria-expanded={categoriesOpen}
              onClick={toggleCategoriesOpen}
              data-testid="catalog-category-toggle"
              className="gm-catalog-category-toggle"
            >
              <CategoryToggleContent mode={categoryMode} count={selectedCategoryItems.length} />
            </Button>
          )}
          <SearchBar initialValue={search} onSearch={(value) => updateParam('search', value || null)} />
        </div>

        {isStore ? (
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
        ) : (
          <div className="gm-catalog-category-panel" data-testid="catalog-category-panel">
            {categoryMode === 'text' && (
              <Row gap="sm" wrap align="center">
                <Button
                  variant="secondary"
                  size="sm"
                  aria-label={`Категории, выбрано ${selectedCategoryItems.length}`}
                  aria-controls="catalog-category-list"
                  aria-expanded={categoriesOpen}
                  onClick={toggleCategoriesOpen}
                  data-testid="catalog-category-toggle"
                  className="gm-catalog-category-toggle"
                >
                  <CategoryToggleContent mode={categoryMode} count={selectedCategoryItems.length} />
                </Button>
              </Row>
            )}

            {categoriesOpen && (
              <Stack
                gap="sm"
                className="gm-catalog-category-panel__body"
                onFocus={touchCategoryPanel}
                onKeyDown={touchCategoryPanel}
                onPointerDown={touchCategoryPanel}
                data-testid="catalog-category-panel-body"
              >
                <Row gap="sm" wrap align="center">
                  <Button
                    variant={categoryMode === 'text' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setCategoryMode('text')}
                  >
                    Текст
                  </Button>
                  <Button
                    variant={categoryMode === 'icons' ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setCategoryMode('icons')}
                  >
                    Иконки
                  </Button>
                  <label className="gm-catalog-category-panel__toggle">
                    <input
                      type="checkbox"
                      checked={autoCollapseCategories}
                      onChange={(event) => setAutoCollapseCategories(event.currentTarget.checked)}
                    />
                    <Text variant="caption" as="span">
                      Автосворачивание
                    </Text>
                  </label>
                </Row>

                <div
                  id="catalog-category-list"
                  className={`gm-catalog-category-list gm-catalog-category-list--${categoryMode}`}
                  aria-label="Категории"
                  data-testid="catalog-category-list"
                >
                  {categoryItems.map(({ group, depth, iconKind, label }) => (
                    <Chip
                      key={group.id}
                      selected={selectedGroupIds.has(group.id)}
                      disabled={groupsState.status === 'loading'}
                      onClick={() => toggleGroup(group.id)}
                      title={group.name}
                      aria-label={categoryMode === 'icons' ? group.name : undefined}
                      className="gm-catalog-category-chip"
                      style={{ '--gm-category-depth': depth } as CSSProperties}
                    >
                      <CategoryIcon kind={iconKind} />
                      {categoryMode === 'text' && (
                        <span className="gm-catalog-category-chip__label">
                          {label}
                        </span>
                      )}
                    </Chip>
                  ))}
                  {groupsState.status === 'loading' && <Text tone="secondary">Категории загружаются</Text>}
                  {groupsState.status === 'error' && <Text tone="secondary">{groupsState.message}</Text>}
                </div>
              </Stack>
            )}
          </div>
        )}

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
          {hasFilters && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Очистить фильтры
            </Button>
          )}
        </Row>

        <Row gap="sm" wrap align="center" aria-label="Активные фильтры">
          {search && <Chip onClick={() => updateParam('search', null)}>Поиск: {search} ×</Chip>}
          {selectedCategoryItems.map(({ group, iconKind }) => (
            <Chip
              key={group.id}
              selected
              onClick={() => toggleGroup(group.id)}
              title={group.name}
              aria-label={categoryMode === 'icons' ? `Убрать категорию ${group.name}` : undefined}
              className={`gm-catalog-selected-category gm-catalog-selected-category--${categoryMode}`}
            >
              <CategoryIcon kind={iconKind} />
              {categoryMode === 'text' && <span>{group.name} ×</span>}
            </Chip>
          ))}
          {sellerIds.length > 0 && <Chip onClick={() => updateParam('seller_id', null)}>Продавцы: {sellerIds.join(', ')} ×</Chip>}
          {!search && selectedGroups.length === 0 && sellerIds.length === 0 && <Text tone="secondary">Фильтры не применены</Text>}
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
                onOpen={(product) => navigate(productRoute(product))}
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
