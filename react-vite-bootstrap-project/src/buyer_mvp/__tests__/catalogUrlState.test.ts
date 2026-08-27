import { describe, expect, it } from 'vitest';
import {
  catalogGroupIds,
  catalogSellerIds,
  catalogGroupOptions,
  catalogGroupOptionLabel,
  clearCatalogSearchParams,
  selectedCatalogGroups,
  toggleCatalogGroupParam,
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
  it('preserves search and sort when categories change and resets page', () => {
    const next = updateCatalogSearchParams(
      new URLSearchParams('search=milk&group_id=12&sort=price&page=3'),
      'group_id',
      '7,8',
    );

    expect(next.toString()).toBe('search=milk&group_id=7%2C8&sort=price&page=1');
  });

  it('keeps a child category own group_id', () => {
    const next = updateCatalogSearchParams(new URLSearchParams('search=milk&page=4'), 'group_id', '3');

    expect(next.toString()).toBe('search=milk&page=1&group_id=3');
  });

  it('toggles multiple category ids without replacing siblings', () => {
    expect(toggleCatalogGroupParam([17], 18)).toBe('17,18');
    expect(toggleCatalogGroupParam([17, 18], 17)).toBe('18');
    expect(toggleCatalogGroupParam([17], 17)).toBeNull();
  });

  it('uses an empty category array when no category filter is selected', () => {
    expect(catalogGroupIds(null)).toEqual([]);
  });

  it('preserves filters when page changes', () => {
    const next = updateCatalogSearchParams(
      new URLSearchParams('search=milk&group_id=12,13&seller_id=6,7&sort=price&page=2'),
      'page',
      '3',
    );

    expect(next.toString()).toBe('search=milk&group_id=12%2C13&seller_id=6%2C7&sort=price&page=3');
  });

  it('keeps combined categories when search and sort change and resets page', () => {
    const afterSearch = updateCatalogSearchParams(
      new URLSearchParams('group_id=12,13&sort=price&page=4'),
      'search',
      'milk',
    );
    const afterSort = updateCatalogSearchParams(afterSearch, 'sort', 'name');

    expect(afterSearch.toString()).toBe('group_id=12%2C13&sort=price&page=1&search=milk');
    expect(afterSort.toString()).toBe('group_id=12%2C13&sort=name&page=1&search=milk');
  });

  it('clears search and categories back to canonical default filters', () => {
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

  it('restores selected categories from URL group_id', () => {
    expect(catalogGroupIds('1,3')).toEqual([1, 3]);
    expect(selectedCatalogGroups(groups, [1, 3]).map((group) => group.name)).toEqual([
      'Овощи',
      'Огурцы',
    ]);
  });

  it('restores different category sets from browser back and forward URL states', () => {
    expect(catalogGroupIds(new URLSearchParams('group_id=1,3').get('group_id'))).toEqual([1, 3]);
    expect(catalogGroupIds(new URLSearchParams('group_id=2,5').get('group_id'))).toEqual([2, 5]);
  });

  it('rejects malformed manual group_id values before UI can reuse them', () => {
    expect(catalogGroupIds('17,abc')).toBeUndefined();
  });

  it('restores selected seller ids from URL seller_id', () => {
    expect(catalogSellerIds('6,7')).toEqual([6, 7]);
    expect(catalogSellerIds('6,abc')).toBeUndefined();
  });
});
