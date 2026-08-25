export type MapSearchMode = 'seller' | 'product';

export type SearchKeyAction =
  | { type: 'noop' }
  | { type: 'close' }
  | { type: 'submit-seller' }
  | { type: 'select-product'; index: number }
  | { type: 'navigate'; index: number };

export interface SearchKeyContext {
  mode: MapSearchMode;
  key: string;
  activeIndex: number;
  optionCount: number;
}

export function nextOptionIndex(current: number, count: number, key: 'ArrowDown' | 'ArrowUp') {
  if (count <= 0) return -1;
  if (key === 'ArrowDown') return current < 0 ? 0 : (current + 1) % count;
  return current <= 0 ? count - 1 : current - 1;
}

export function resolveSearchKeyAction({
  mode,
  key,
  activeIndex,
  optionCount,
}: SearchKeyContext): SearchKeyAction {
  if (key === 'Escape') return { type: 'close' };

  if (key === 'ArrowDown' || key === 'ArrowUp') {
    return { type: 'navigate', index: nextOptionIndex(activeIndex, optionCount, key) };
  }

  if (key !== 'Enter') return { type: 'noop' };

  if (mode === 'seller') return { type: 'submit-seller' };
  if (activeIndex >= 0 && activeIndex < optionCount) return { type: 'select-product', index: activeIndex };
  return { type: 'noop' };
}

export function shouldRunProductSearch(mode: MapSearchMode, trimmedQuery: string): boolean {
  return mode === 'product' && trimmedQuery.length > 0;
}

export function shouldClearProductSearch(mode: MapSearchMode, trimmedQuery: string): boolean {
  return mode === 'product' && trimmedQuery.length === 0;
}

export function scheduleProductSearch(
  query: string,
  delayMs: number,
  timerApi: Pick<typeof globalThis, 'setTimeout' | 'clearTimeout'>,
  onSearch: (value: string) => void,
) {
  const timer = timerApi.setTimeout(() => onSearch(query), delayMs);
  return () => timerApi.clearTimeout(timer);
}
