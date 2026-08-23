import { useEffect, useMemo, useState, type KeyboardEvent } from 'react';
import { EmptyState, ErrorState, ListItem, Loader, Surface, Text } from '@/design-system/components';
import type { ProductSellerMatch } from '@/platform-core/map/product-search/ProductSearch';
import type { ProductSearchState } from '@/platform-core/map/viewmodels/MapViewModel';
import { nextOptionIndex } from './MapSearchAutocomplete.logic';

const SEARCH_DEBOUNCE_MS = 250;

interface MapSearchAutocompleteProps {
  query: string;
  productSearch: ProductSearchState;
  onQueryChange: (value: string) => void;
  onSearch: (query: string) => void;
  onClear: () => void;
  onProductSelect: (match: ProductSellerMatch) => void;
}

export function MapSearchAutocomplete({
  query,
  productSearch,
  onQueryChange,
  onSearch,
  onClear,
  onProductSelect,
}: MapSearchAutocompleteProps) {
  const [open, setOpen] = useState(() => query.trim().length > 0);
  const [activeIndex, setActiveIndex] = useState(-1);
  const trimmed = query.trim();
  const matches = productSearch.result?.sellers ?? [];
  const listId = 'map-product-search-results';
  const activeId = activeIndex >= 0 ? `${listId}-${activeIndex}` : undefined;

  useEffect(() => {
    setActiveIndex(-1);
  }, [matches.length, productSearch.status, productSearch.query]);

  useEffect(() => {
    if (!trimmed) {
      onClear();
      return;
    }
    const timer = window.setTimeout(() => onSearch(trimmed), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [trimmed, onSearch, onClear]);

  const isFresh = productSearch.query === trimmed;
  const showPanel = open && trimmed.length > 0;
  const showLoading = showPanel && productSearch.status === 'loading' && isFresh;
  const showError = showPanel && productSearch.status === 'error' && isFresh;
  const showEmpty = showPanel && productSearch.status === 'success' && isFresh && matches.length === 0;
  const showResults = showPanel && productSearch.status === 'success' && isFresh && matches.length > 0;

  const label = useMemo(
    () => (productSearch.result?.suggestedProduct ? `Возможно: ${productSearch.result.suggestedProduct}` : 'Поиск товара на карте'),
    [productSearch.result?.suggestedProduct],
  );

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (['ArrowDown', 'ArrowUp', 'Enter', 'Escape'].includes(event.key)) event.stopPropagation();
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((current) => nextOptionIndex(current, matches.length, event.key as 'ArrowDown' | 'ArrowUp'));
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0 && matches[activeIndex]) {
      event.preventDefault();
      setOpen(false);
      onProductSelect(matches[activeIndex]);
    }
  }

  function clear() {
    onQueryChange('');
    onClear();
    setOpen(false);
  }

  return (
    <div className="gm-map-search" role="search">
      <label className="gm-map-search__label" htmlFor="map-product-search">
        {label}
      </label>
      <div className="gm-map-search__field">
        <input
          id="map-product-search"
          type="search"
          value={query}
          onChange={(event) => {
            onQueryChange(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Найти товар"
          aria-label="Поиск товара на карте"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-activedescendant={activeId}
          role="combobox"
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
