import type {
  ApiErrorBody,
  CatalogQuery,
  ProductDetail,
  ProductGroupsResponse,
  ProductListResponse,
} from './types';

// Открытый вопрос из брифа (раздел 10, CORS/домен) пока не решён. В деве
// используем относительный путь — его обслуживает прокси в vite.config.ts.
// В проде обязательно задать VITE_API_BASE (иначе запросы уйдут на сам
// фронтовый origin и 404-нутся) — как только CORS/домен согласуют с Романом.
const API_BASE = import.meta.env.VITE_API_BASE ?? '/api/v1/catalog';

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
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`);
  } catch {
    // fetch сам бросает исключение только на сетевую ошибку (не 4xx/5xx) —
    // сюда же попадёт и CORS-блокировка браузером (см. открытый вопрос в брифе).
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
  const params = new URLSearchParams();
  if (query.groupId != null) params.set('group_id', String(query.groupId));
  if (query.search) params.set('search', query.search);
  params.set('sort', query.sort ?? 'name');
  params.set('page', String(query.page ?? 1));
  if (query.limit != null) params.set('limit', String(query.limit));
  return request<ProductListResponse>(`/products?${params.toString()}`);
}

export function fetchProduct(id: number): Promise<ProductDetail> {
  return request<ProductDetail>(`/products/${id}`);
}
