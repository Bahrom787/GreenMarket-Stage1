import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { EmptyState, ErrorState, ListItem, Loader, Surface, Text } from '@/design-system/components';
import type { ProductSellerMatch } from '@/platform-core/map/product-search/ProductSearch';
import type { ProductSearchState } from '@/platform-core/map/viewmodels/MapViewModel';
import {
  resolveSearchKeyAction,
  scheduleProductSearch,
  shouldClearProductSearch,
  shouldRunProductSearch,
  type MapSearchMode,
} from './MapSearchAutocomplete.logic';

const SEARCH_DEBOUNCE_MS = 250;

interface MapSearchAutocompleteProps {
  mode: MapSearchMode;
  query: string;
  productSearch: ProductSearchState;
  onModeChange: (mode: MapSearchMode) => void;
  onQueryChange: (value: string) => void;
  onSellerSubmit: (query: string) => void;
  onProductSearch: (query: string) => void;
  onClear: () => void;
  onProductSelect: (match: ProductSellerMatch) => void;
}

export function MapSearchAutocomplete({
  mode,
  query,
  productSearch,
  onModeChange,
  onQueryChange,
  onSellerSubmit,
  onProductSearch,
  onClear,
  onProductSelect,
}: MapSearchAutocompleteProps) {
  const [open, setOpen] = useState(() => mode === 'product' && query.trim().length > 0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const trimmed = query.trim();
  const matches = productSearch.result?.sellers ?? [];
  const listId = 'map-product-search-results';
  const activeId = activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;

  useEffect(() => {
    setActiveIndex(-1);
  }, [matches.length, mode, productSearch.status, productSearch.query]);

  useEffect(() => {
    if (mode !== 'product') {
      setOpen(false);
      return;
    }
    if (shouldClearProductSearch(mode, trimmed)) {
      onClear();
      return;
    }
    if (!shouldRunProductSearch(mode, trimmed)) return;
    return scheduleProductSearch(trimmed, SEARCH_DEBOUNCE_MS, window, onProductSearch);
  }, [mode, trimmed, onProductSearch, onClear]);

  const isFresh = productSearch.query === trimmed;
  const showPanel = mode === 'product' && open && trimmed.length > 0;
  const showLoading = showPanel && productSearch.status === 'loading' && isFresh;
  const showError = showPanel && productSearch.status === 'error' && isFresh;
  const showEmpty = showPanel && productSearch.status === 'success' && isFresh && matches.length === 0;
  const showResults = showPanel && productSearch.status === 'success' && isFresh && matches.length > 0;

  const label = useMemo(
    () =>
      mode === 'seller'
        ? 'Поиск продавца на карте'
        : productSearch.result?.suggestedProduct
          ? `Возможно: ${productSearch.result.suggestedProduct}`
          : 'Поиск товара на карте',
    [mode, productSearch.result?.suggestedProduct],
  );

  const placeholder = mode === 'seller' ? 'Найти продавца' : 'Найти товар';

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) event.stopPropagation();
    const action = resolveSearchKeyAction({
      mode,
      key: event.key,
      activeIndex,
      optionCount: matches.length,
    });

    if (action.type === 'close') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (action.type === 'navigate') {
      event.preventDefault();
      if (mode === 'product') setOpen(true);
      setActiveIndex(action.index);
      return;
    }

    if (action.type === 'submit-seller') {
      event.preventDefault();
      if (trimmed) onSellerSubmit(trimmed);
      return;
    }

    if (action.type === 'select-product' && matches[action.index]) {
      event.preventDefault();
      setOpen(false);
      onProductSelect(matches[action.index]);
    }
  }

  function clear() {
    onQueryChange('');
    onClear();
    setOpen(false);
  }

  return (
    <div className="gm-map-search" role="search" data-mode={mode}>
      <div className="gm-map-search__mode" role="tablist" aria-label="Режим поиска на карте">
        <button
          type="button"
          role="tab"
          className="gm-map-search__mode-button"
          aria-selected={mode === 'seller'}
          data-active={mode === 'seller'}
          onClick={() => onModeChange('seller')}
        >
          Продавцы
        </button>
        <button
          type="button"
          role="tab"
          className="gm-map-search__mode-button"
          aria-selected={mode === 'product'}
          data-active={mode === 'product'}
          onClick={() => onModeChange('product')}
        >
          Товары
        </button>
      </div>

      <label className="gm-map-search__label" htmlFor="map-search-input">
        {label}
      </label>
      <div className="gm-map-search__field">
        <input
          id="map-search-input"
          type="search"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            if (mode === 'product') setOpen(true);
          }}
          onFocus={() => {
            if (mode === 'product') setOpen(true);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          aria-label={label}
          aria-expanded={showPanel}
          aria-controls={mode === 'product' ? listId : undefined}
          aria-activedescendant={mode === 'product' ? activeId : undefined}
          role={mode === 'product' ? 'combobox' : 'searchbox'}
          autoComplete="off"
          data-testid="map-search"
        />
        {query && (
          <button type="button" className="gm-map-search__clear gm-focusable" onClick={clear} aria-label="Очистить поиск">
            x
          </button>
        )}
      </div>

      {showPanel && (
        <Surface id={listId} className="gm-map-search__panel" role="listbox" bordered elevation={2}>
          {showLoading && (
            <div className="gm-map-search__status">
              <Loader size="md" label="Поиск товара" />
              <Text variant="caption" tone="secondary">
                Ищем...
              </Text>
            </div>
          )}

          {showError && <ErrorState title="Не удалось выполнить поиск" description={productSearch.error ?? undefined} />}
          {showEmpty && <EmptyState title="Ничего не найдено" description={`По запросу «${trimmed}» нет товаров`} />}

          {showResults &&
            matches.map((match, index) => (
              <ListItem
                key={`${match.seller.sellerId}-${match.productName}`}
                id={`${listId}-${index}`}
                role="option"
                selected={index === activeIndex}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => {
                  setOpen(false);
                  onProductSelect(match);
                }}
              >
                <span className="gm-map-search__result">
                  <Text variant="bodyStrong">{match.productName}</Text>
                  <Text variant="caption" tone="secondary">
                    {match.seller.name} · {match.price} ₽ / {match.unit}
                  </Text>
                </span>
              </ListItem>
            ))}
        </Surface>
      )}
    </div>
  );
}
