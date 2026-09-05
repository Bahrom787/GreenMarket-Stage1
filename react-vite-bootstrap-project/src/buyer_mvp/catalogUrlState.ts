import type { ProductGroup, SortOrder } from './types';

export type CatalogParam = 'search' | 'group_id' | 'seller_id' | 'state' | 'sort' | 'page';

export function updateCatalogSearchParams(
  current: URLSearchParams,
  key: CatalogParam,
  value: string | null,
) {
  const next = new URLSearchParams(current);
  if (value) next.set(key, value);
  else next.delete(key);
  if (key !== 'page') next.set('page', '1');
  return next;
}

export function clearCatalogSearchParams() {
  return new URLSearchParams({ sort: 'name', page: '1' });
}

export function catalogPage(value: string | null) {
  const parsed = Number(value ?? '1');
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
}

export function catalogSort(value: string | null): SortOrder {
  return value === 'price' ? 'price' : 'name';
}

export function catalogGroupIds(value: string | null) {
  if (!value) return [];
  const ids = value.split(',').map((part) => Number(part.trim()));
  return ids.length > 0 && ids.every((id) => Number.isInteger(id) && id > 0)
    ? [...new Set(ids)]
    : undefined;
}

export const catalogSellerIds = catalogGroupIds;

export function catalogStateIds(value: string | null) {
  if (!value) return [];
  const ids = value.split(',').map((part) => part.trim()).filter(Boolean);
  return ids.every((id) => id === 'open' || id === 'available') ? [...new Set(ids)] : undefined;
}

export function toggleCatalogStateParam(currentIds: string[], stateId: 'open' | 'available') {
  const selected = new Set(currentIds);
  if (selected.has(stateId)) selected.delete(stateId);
  else selected.add(stateId);
  const next = [...selected];
  return next.length ? next.join(',') : null;
}

export interface CatalogGroupOption {
  group: ProductGroup;
  depth: number;
}

export function catalogGroupOptions(groups: ProductGroup[]): CatalogGroupOption[] {
  const children = new Map<number | null, ProductGroup[]>();
  for (const group of groups) {
    children.set(group.parent_id, [...(children.get(group.parent_id) ?? []), group]);
  }

  for (const groupList of children.values()) {
    groupList.sort((left, right) => left.sort_order - right.sort_order);
  }

  const result: CatalogGroupOption[] = [];
  const visit = (parentId: number | null, depth: number) => {
    for (const group of children.get(parentId) ?? []) {
      result.push({ group, depth });
      visit(group.id, depth + 1);
    }
  };

  visit(null, 0);
  return result;
}

export function selectedCatalogGroups(groups: ProductGroup[], groupIds: number[]) {
  const selected = new Set(groupIds);
  return groups.filter((group) => selected.has(group.id));
}

export function catalogGroupOptionLabel(option: CatalogGroupOption) {
  return `${'— '.repeat(option.depth)}${option.group.name}`;
}

export function toggleCatalogGroupParam(currentIds: number[], groupId: number) {
  const selected = new Set(currentIds);
  if (selected.has(groupId)) selected.delete(groupId);
  else selected.add(groupId);
  const next = [...selected];
  return next.length ? next.join(',') : null;
}
