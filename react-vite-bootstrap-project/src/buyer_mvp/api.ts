import type {
  ApiErrorBody,
  CatalogQuery,
  ProductDetail,
  ProductGroupsResponse,
  ProductListResponse,
  SellerCardResponse,
  SellerCatalogItem,
  SellerCatalogResponse,
} from './types';

const CATALOG_API_SCOPE = '/api/v1/catalog';
const SELLER_PRODUCT_LOOKUP_LIMIT = 100;
const configuredApiBase = import.meta.env.VITE_API_BASE as string | undefined;

// In production the backend origin must be configured explicitly. Falling back to
// the frontend origin hides deployment errors and makes API connectivity unverifiable.
let apiBaseConfigError: string | undefined;
const API_BASE = (() => {
  try {
    return (
      normalizeCatalogApiBase(configuredApiBase) ?? (import.meta.env.DEV ? CATALOG_API_SCOPE : '')
    );
  } catch (err) {
    apiBaseConfigError = err instanceof Error ? err.message : 'VITE_API_BASE is invalid.';
    return '';
  }
})();

export function normalizeCatalogApiBase(value?: string) {
  const base = value?.trim().replace(/\/+$/, '');
  if (!base) return undefined;
  if (base === CATALOG_API_SCOPE) return base;

  const url = new URL(base);
  if (url.search || url.hash) throw new Error('VITE_API_BASE must not include query or hash.');

  const path = url.pathname.replace(/\/+$/, '');
  if (!path) return `${url.origin}${CATALOG_API_SCOPE}`;
  if (path === CATALOG_API_SCOPE) return `${url.origin}${CATALOG_API_SCOPE}`;

  throw new Error('VITE_API_BASE must be backend origin or /api/v1/catalog.');
}

export class CatalogApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
  ) {
    super(message);
    this.name = 'CatalogApiError';
  }
}

async function request<T>(path: string): Promise<T> {
  if (apiBaseConfigError) {
    throw new CatalogApiError(apiBaseConfigError, 0, 'API_BASE_INVALID');
  }

  if (!API_BASE) {
    throw new CatalogApiError(
      'Production API не настроен: задайте VITE_API_BASE для Catalog API.',
      0,
      'API_BASE_MISSING',
    );
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`);
  } catch {
    throw new CatalogApiError('Не удалось связаться с сервером. Проверьте подключение.', 0);
  }

  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as ApiErrorBody | null;
    throw new CatalogApiError(
      body?.error?.message ?? `Запрос завершился ошибкой (${response.status})`,
      response.status,
      body?.error?.code,
    );
  }

  return response.json() as Promise<T>;
}

export function fetchGroups(): Promise<ProductGroupsResponse> {
  return request<ProductGroupsResponse>('/groups');
}

export function fetchProducts(query: CatalogQuery = {}): Promise<ProductListResponse> {
  return request<ProductListResponse>(`/products?${productQueryString(query)}`);
}

export function fetchSeller(storeId: string): Promise<SellerCardResponse> {
  return request<SellerCardResponse>(`/sellers/${encodeURIComponent(storeId)}`);
}

export function fetchSellerProducts(
  storeId: string,
  query: CatalogQuery = {},
): Promise<SellerCatalogResponse> {
  return request<SellerCatalogResponse>(
    `/sellers/${encodeURIComponent(storeId)}/products?${productQueryString(query)}`,
  );
}

export async function fetchSellerProduct(
  storeId: string,
  productId: number,
  sellerProductId?: number,
): Promise<SellerCatalogItem> {
  let page = 1;
  let hasNextPage = true;

  while (hasNextPage) {
    // ponytail: scoped list scan until backend exposes /sellers/{storeId}/products/{productId}.
    const res = await fetchSellerProducts(storeId, { page, limit: SELLER_PRODUCT_LOOKUP_LIMIT });
    const found = res.products.find(
      (product) =>
        product.product_id === productId &&
        (sellerProductId == null || product.seller_product_id === sellerProductId),
    );
    if (found) return found;

    const limit = res.limit || SELLER_PRODUCT_LOOKUP_LIMIT;
    hasNextPage = page * limit < res.total;
    if (!hasNextPage) {
      throw new CatalogApiError(
        'Предложение магазина больше недоступно.',
        404,
        'SELLER_PRODUCT_NOT_FOUND',
      );
    }
    page += 1;
  }

  throw new CatalogApiError(
    'Предложение магазина больше недоступно.',
    404,
    'SELLER_PRODUCT_NOT_FOUND',
  );
}

function productQueryString(query: CatalogQuery) {
  const params = new URLSearchParams();
  if (query.search) params.set('search', query.search);
  params.set('sort', query.sort ?? 'name');
  params.set('page', String(query.page ?? 1));
  if (query.limit != null) params.set('limit', String(query.limit));
  return [query.groupIds?.length ? `group_id=${query.groupIds.join(',')}` : '', params.toString()]
    .filter(Boolean)
    .join('&');
}

export function fetchProduct(id: number): Promise<ProductDetail> {
  return request<ProductDetail>(`/products/${id}`);
}
