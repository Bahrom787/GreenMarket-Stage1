const KEY = 'gm.searchFilterBar.filters.v1';

export interface StoredSearchFilters {
  searchQuery: string;
  categoryIds: number[];
  sellerIds: number[];
  stateIds: string[];
  sort: 'name' | 'price' | 'delivery';
  sortDirection: 'asc' | 'desc';
}

const empty: StoredSearchFilters = {
  searchQuery: '',
  categoryIds: [],
  sellerIds: [],
  stateIds: [],
  sort: 'name',
  sortDirection: 'asc',
};

function strings(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function loadStoredSearchFilters(): StoredSearchFilters {
  if (typeof localStorage === 'undefined') return empty;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? '{}') as Partial<StoredSearchFilters> & { search?: unknown };
    return {
      searchQuery: typeof parsed.searchQuery === 'string' ? parsed.searchQuery : typeof parsed.search === 'string' ? parsed.search : '',
      categoryIds: Array.isArray(parsed.categoryIds) ? parsed.categoryIds.filter(Number.isInteger) : [],
      sellerIds: Array.isArray(parsed.sellerIds) ? parsed.sellerIds.filter(Number.isInteger) : [],
      stateIds: strings(parsed.stateIds).filter((id) => id === 'open' || id === 'available'),
      sort: parsed.sort === 'price' || parsed.sort === 'delivery' ? parsed.sort : 'name',
      sortDirection: parsed.sortDirection === 'desc' ? 'desc' : 'asc',
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
