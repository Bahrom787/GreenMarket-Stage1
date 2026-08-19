import type {
  ApiErrorBody,
  CatalogQuery,
  ProductDetail,
  ProductGroupsResponse,
  ProductListResponse,
  SellerCardResponse,
  SellerCatalogResponse,
} from './types';

const CATALOG_API_SCOPE = '/api/v1/catalog';
const configuredApiBase = import.meta.env.VITE_API_BASE as string | undefined;

// In production the backend origin must be configured explicitly. Falling back to
// the frontend origin hides deployment errors and makes API connectivity unverifiable.
let apiBaseConfigError: string | undefined;
const API_BASE = (() => {
  try {
    return normalizeCatalogApiBase(configuredApiBase) ?? (import.meta.env.DEV ? CATALOG_API_SCOPE : '');
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
  return request<ProductListResponse>(`/products?${productQueryParams(query).toString()}`);
}

export function fetchSeller(storeId: string): Promise<SellerCardResponse> {
  return request<SellerCardResponse>(`/sellers/${encodeURIComponent(storeId)}`);
}

export function fetchSellerProducts(storeId: string, query: CatalogQuery = {}): Promise<SellerCatalogResponse> {
  return request<SellerCatalogResponse>(
    `/sellers/${encodeURIComponent(storeId)}/products?${productQueryParams(query).toString()}`,
  );
}

function productQueryParams(query: CatalogQuery) {
  const params = new URLSearchParams();
  if (query.groupId != null) params.set('group_id', String(query.groupId));
  if (query.search) params.set('search', query.search);
  params.set('sort', query.sort ?? 'name');
  params.set('page', String(query.page ?? 1));
  if (query.limit != null) params.set('limit', String(query.limit));
  return params;
}

export function fetchProduct(id: number): Promise<ProductDetail> {
  return request<ProductDetail>(`/products/${id}`);
}
