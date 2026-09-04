import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { asSellerId } from '@/platform-core/contracts/Action';
import type { ProductSearchState } from '@/platform-core/map/viewmodels/MapViewModel';
import {
  nextOptionIndex,
  resolveSearchKeyAction,
  scheduleProductSearch,
  shouldClearProductSearch,
  shouldRunProductSearch,
} from '../MapSearchAutocomplete.logic';
import { MapSearchAutocomplete } from '../MapSearchAutocomplete';

function html(state: ProductSearchState, mode: 'seller' | 'product' = 'product', query = state.query) {
  return renderToStaticMarkup(
    <MapSearchAutocomplete
      mode={mode}
      query={query}
      productSearch={state}
      onQueryChange={() => undefined}
      onSellerSubmit={() => undefined}
      onProductSearch={() => undefined}
      onClear={() => undefined}
      onProductSelect={() => undefined}
    />,
  );
}

const idle: ProductSearchState = { query: '', status: 'idle', result: null, error: null };

afterEach(() => {
  vi.useRealTimers();
});

describe('MapSearchAutocomplete markup', () => {
  it('renders seller and product search modes', () => {
    assert.match(html(idle, 'seller'), /role="searchbox"/);
    assert.match(html(idle, 'seller'), /Найти продавца/);

    assert.match(html(idle), /role="combobox"/);
    assert.match(html(idle), /aria-expanded="false"/);
  });

  it('renders loading, results, empty and error states for product mode', () => {
    assert.match(html({ query: 'milk', status: 'loading', result: null, error: null }), /Ищем/);

    assert.match(
      html({
        query: 'milk',
        status: 'success',
        error: null,
        result: {
          matchedProduct: 'Milk',
          suggestedProduct: null,
          sellers: [
            {
              productName: 'Milk',
              price: 120,
              unit: 'l',
              seller: { sellerId: asSellerId('seller-1'), name: 'Dairy Shop' },
            },
          ],
        },
      }),
      /Milk[\s\S]*Dairy Shop[\s\S]*120/,
    );

    assert.match(
      html({ query: 'missing', status: 'success', result: { matchedProduct: null, suggestedProduct: null, sellers: [] }, error: null }),
      /Ничего не найдено/,
    );
    assert.match(html({ query: 'milk', status: 'error', result: null, error: 'Backend unavailable' }), /Backend unavailable/);
  });
});

describe('MapSearchAutocomplete logic', () => {
  it('handles option index keyboard movement', () => {
    assert.equal(nextOptionIndex(-1, 3, 'ArrowDown'), 0);
    assert.equal(nextOptionIndex(2, 3, 'ArrowDown'), 0);
    assert.equal(nextOptionIndex(0, 3, 'ArrowUp'), 2);
    assert.equal(nextOptionIndex(1, 3, 'ArrowUp'), 0);
    assert.equal(nextOptionIndex(1, 0, 'ArrowDown'), -1);
  });

  it('keeps seller and product enter callbacks distinct', () => {
    expect(resolveSearchKeyAction({ mode: 'seller', key: 'Enter', activeIndex: -1, optionCount: 0 })).toEqual({ type: 'submit-seller' });
    expect(resolveSearchKeyAction({ mode: 'product', key: 'Enter', activeIndex: 1, optionCount: 3 })).toEqual({ type: 'select-product', index: 1 });
    expect(resolveSearchKeyAction({ mode: 'product', key: 'Enter', activeIndex: -1, optionCount: 3 })).toEqual({ type: 'noop' });
  });

  it('handles escape and arrow navigation', () => {
    expect(resolveSearchKeyAction({ mode: 'product', key: 'Escape', activeIndex: 0, optionCount: 3 })).toEqual({ type: 'close' });
    expect(resolveSearchKeyAction({ mode: 'product', key: 'ArrowDown', activeIndex: -1, optionCount: 3 })).toEqual({ type: 'navigate', index: 0 });
    expect(resolveSearchKeyAction({ mode: 'product', key: 'ArrowUp', activeIndex: 0, optionCount: 3 })).toEqual({ type: 'navigate', index: 2 });
  });

  it('runs product search only for non-empty product queries', () => {
    assert.equal(shouldRunProductSearch('seller', 'milk'), false);
    assert.equal(shouldRunProductSearch('product', ''), false);
    assert.equal(shouldRunProductSearch('product', 'milk'), true);

    assert.equal(shouldClearProductSearch('seller', ''), false);
    assert.equal(shouldClearProductSearch('product', ''), true);
    assert.equal(shouldClearProductSearch('product', 'milk'), false);
  });

  it('debounces product search callback', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const cancel = scheduleProductSearch('milk', 250, globalThis, onSearch);

    vi.advanceTimersByTime(249);
    expect(onSearch).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(onSearch).toHaveBeenCalledWith('milk');

    cancel();
  });

  it('cancels stale debounced search', () => {
    vi.useFakeTimers();
    const onSearch = vi.fn();
    const cancel = scheduleProductSearch('milk', 250, globalThis, onSearch);

    cancel();
    vi.advanceTimersByTime(250);
    expect(onSearch).not.toHaveBeenCalled();
  });
});
