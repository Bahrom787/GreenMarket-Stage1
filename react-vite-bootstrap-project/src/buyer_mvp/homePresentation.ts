import type { ProductGroup } from './types';

type CategoryPresentation = {
  tone: 1 | 2 | 3 | 4;
  icon: string;
};

const categoryPresentationByKeyword: Array<[string, CategoryPresentation]> = [
  ['яблок', { tone: 1, icon: '🍎' }],
  ['фрукт', { tone: 1, icon: '🍎' }],
  ['овощ', { tone: 2, icon: '🥬' }],
  ['зел', { tone: 2, icon: '🥬' }],
  ['мол', { tone: 3, icon: '🥛' }],
  ['сыр', { tone: 3, icon: '🥛' }],
  ['мяс', { tone: 4, icon: '🥩' }],
  ['рыб', { tone: 3, icon: '🐟' }],
  ['хлеб', { tone: 2, icon: '🥖' }],
  ['выпеч', { tone: 2, icon: '🥖' }],
  ['мед', { tone: 1, icon: '🍯' }],
  ['мёд', { tone: 1, icon: '🍯' }],
];

const fallbackPresentation: CategoryPresentation = { tone: 1, icon: '•' };

export function productCountLabel(count: number) {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} товар`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} товара`;
  return `${count} товаров`;
}

export function rootGroups(groups: ProductGroup[]) {
  return groups
    .filter((group) => group.parent_id === null)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function groupsWithMoreProducts(groups: ProductGroup[]) {
  return [...groups]
    .filter((group) => group.product_count > 0)
    .sort((a, b) => b.product_count - a.product_count)
    .slice(0, 5);
}

export function catalogGroupPath(groupId: number) {
  return `/catalog?group_id=${groupId}`;
}

export function catalogSearchPath(value: string) {
  const query = value.trim();
  return `/catalog${query ? `?search=${encodeURIComponent(query)}` : ''}`;
}

export function categoryPresentation(group: ProductGroup): CategoryPresentation {
  const normalized = group.name.toLocaleLowerCase('ru-RU');
  return (
    categoryPresentationByKeyword.find(([keyword]) => normalized.includes(keyword))?.[1] ??
    fallbackPresentation
  );
}
