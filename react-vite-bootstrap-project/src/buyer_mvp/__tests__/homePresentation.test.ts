import { describe, expect, it } from 'vitest';
import {
  catalogGroupPath,
  catalogSearchPath,
  categoryPresentation,
  groupsWithMoreProducts,
  productCountLabel,
  rootGroups,
} from '../homePresentation';
import type { ProductGroup } from '../types';

const groups: ProductGroup[] = [
  { id: 3, parent_id: null, name: 'Молочные продукты', sort_order: 30, product_count: 1 },
  { id: 1, parent_id: null, name: 'Овощи', sort_order: 10, product_count: 24 },
  { id: 2, parent_id: null, name: 'Мясо', sort_order: 20, product_count: 5 },
  { id: 4, parent_id: 1, name: 'Зелень', sort_order: 40, product_count: 7 },
  { id: 5, parent_id: null, name: 'Пустой раздел', sort_order: 50, product_count: 0 },
];

describe('homePresentation', () => {
  it('keeps only root categories and sorts them by sort_order', () => {
    expect(rootGroups(groups).map((group) => group.id)).toEqual([1, 2, 3, 5]);
  });

  it('names quantity-based shortcuts without claiming popularity', () => {
    expect(groupsWithMoreProducts(groups).map((group) => group.id)).toEqual([1, 2, 3]);
  });

  it('builds stable catalog routes', () => {
    expect(catalogGroupPath(42)).toBe('/?group_id=42');
    expect(catalogSearchPath(' молоко 2% ')).toBe(
      '/?search=%D0%BC%D0%BE%D0%BB%D0%BE%D0%BA%D0%BE%202%25',
    );
    expect(catalogSearchPath('   ')).toBe('/');
  });

  it('formats Russian product count labels', () => {
    expect(productCountLabel(1)).toBe('1 товар');
    expect(productCountLabel(2)).toBe('2 товара');
    expect(productCountLabel(5)).toBe('5 товаров');
    expect(productCountLabel(11)).toBe('11 товаров');
    expect(productCountLabel(22)).toBe('22 товара');
  });

  it('uses category content instead of API index for presentation', () => {
    expect(categoryPresentation(groups[0]).icon).toBe('🥛');
    expect(categoryPresentation(groups[1]).icon).toBe('🥬');
    expect(categoryPresentation(groups[2]).icon).toBe('🥩');
  });
});
