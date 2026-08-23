import assert from 'node:assert/strict';
import { renderToStaticMarkup } from 'react-dom/server';
import { it } from 'vitest';
import { asSellerId } from '@/platform-core/contracts/Action';
import type { ProductSearchState } from '@/platform-core/map/viewmodels/MapViewModel';
import { nextOptionIndex } from '../MapSearchAutocomplete.logic';
import { MapSearchAutocomplete } from '../MapSearchAutocomplete';

function html(state: ProductSearchState, query = state.query) {
  return renderToStaticMarkup(
    <MapSearchAutocomplete
      query={query}
      productSearch={state}
      onQueryChange={() => undefined}
      onSearch={() => undefined}
      onClear={() => undefined}
      onProductSelect={() => undefined}
    />,
  );
}

const idle: ProductSearchState = { query: '', status: 'idle', result: null, error: null };

it('renders MapSearchAutocomplete states and aria contract', () => {
  assert.match(html(idle), /role="combobox"/);
  assert.match(html(idle), /aria-expanded="false"/);

  assert.match(html({ query: 'milk', status: 'loading', result: null, error: null }), /aria-expanded="true"/);
  assert.match(html({ query: 'milk', status: 'loading', result: null, error: null }), /aria-label="Поиск товара"/);

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

it('handles option index keyboard movement', () => {
  assert.equal(nextOptionIndex(-1, 3, 'ArrowDown'), 0);
  assert.equal(nextOptionIndex(2, 3, 'ArrowDown'), 0);
  assert.equal(nextOptionIndex(0, 3, 'ArrowUp'), 2);
  assert.equal(nextOptionIndex(1, 3, 'ArrowUp'), 0);
  assert.equal(nextOptionIndex(1, 0, 'ArrowDown'), -1);
});
