const KEY = 'gm.searchFilterBar.filters.v1';

export interface StoredSearchFilters {
  categoryIds: number[];
  sellerIds: number[];
  stateIds: string[];
  search: string;
  sort: 'name' | 'price';
  mapFilters: Record<string, string[]>;
}

const empty: StoredSearchFilters = { categoryIds: [], sellerIds: [], stateIds: [], search: '', sort: 'name', mapFilters: {} };

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function loadStoredSearchFilters(): StoredSearchFilters {
  if (typeof localStorage === 'undefined') return empty;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<StoredSearchFilters>;
    const mapFilters =
      parsed.mapFilters && typeof parsed.mapFilters === 'object' && !Array.isArray(parsed.mapFilters)
        ? parsed.mapFilters
        : {};
    return {
      categoryIds: Array.isArray(parsed.categoryIds) ? parsed.categoryIds.filter(Number.isInteger) : [],
      sellerIds: Array.isArray(parsed.sellerIds) ? parsed.sellerIds.filter(Number.isInteger) : [],
      stateIds: strings(parsed.stateIds).filter((id) => id === 'open' || id === 'available'),
      search: typeof parsed.search === 'string' ? parsed.search : '',
      sort: parsed.sort === 'price' ? 'price' : 'name',
      mapFilters: Object.fromEntries(
        Object.entries(mapFilters).map(([key, value]) => [key, strings(value)]).filter(([, value]) => value.length),
      ),
    };
  } catch {
    return empty;
  }
}

export function saveStoredSearchFilters(next: Partial<StoredSearchFilters>) {
  if (typeof localStorage === 'undefined') return;
  const current = loadStoredSearchFilters();
  localStorage.setItem(KEY, JSON.stringify({ ...current, ...next }));
}

export function clearStoredSearchFilters() {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(KEY);
}
