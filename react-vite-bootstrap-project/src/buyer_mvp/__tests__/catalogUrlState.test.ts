import { describe, expect, it } from 'vitest';
import {
  catalogGroupOptions,
  catalogGroupOptionLabel,
  clearCatalogSearchParams,
  selectedCatalogGroup,
  updateCatalogSearchParams,
} from '../catalogUrlState';
import type { ProductGroup } from '../types';

const groups: ProductGroup[] = [
  { id: 2, parent_id: null, name: 'Фрукты', sort_order: 20, product_count: 5 },
  { id: 5, parent_id: 2, name: 'Груши', sort_order: 20, product_count: 2 },
  { id: 1, parent_id: null, name: 'Овощи', sort_order: 10, product_count: 10 },
  { id: 4, parent_id: 1, name: 'Помидоры', sort_order: 20, product_count: 4 },
  { id: 3, parent_id: 1, name: 'Огурцы', sort_order: 10, product_count: 6 },
];

describe('catalog URL state', () => {
  it('preserves search and sort when category changes and resets page', () => {
    const next = updateCatalogSearchParams(
      new URLSearchParams('search=milk&group_id=12&sort=price&page=3'),
      'group_id',
      '7',
    );

    expect(next.toString()).toBe('search=milk&group_id=7&sort=price&page=1');
  });

  it('keeps a child category own group_id', () => {
    const next = updateCatalogSearchParams(new URLSearchParams('search=milk&page=4'), 'group_id', '3');

    expect(next.toString()).toBe('search=milk&page=1&group_id=3');
  });

  it('preserves filters when page changes', () => {
    const next = updateCatalogSearchParams(
      new URLSearchParams('search=milk&group_id=12&sort=price&page=2'),
      'page',
      '3',
    );

    expect(next.toString()).toBe('search=milk&group_id=12&sort=price&page=3');
  });

  it('clears search and category back to canonical default filters', () => {
    expect(clearCatalogSearchParams().toString()).toBe('sort=name&page=1');
  });

  it('renders root and child categories in tree order with visual nesting', () => {
    expect(catalogGroupOptions(groups).map(catalogGroupOptionLabel)).toEqual([
      'Овощи',
      '— Огурцы',
      '— Помидоры',
      'Фрукты',
      '— Груши',
    ]);
  });

  it('restores selected child category from URL group_id', () => {
    expect(selectedCatalogGroup(groups, '3')?.name).toBe('Огурцы');
  });
});
