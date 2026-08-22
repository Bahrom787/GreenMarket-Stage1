export type CatalogContext = { kind: 'global' } | { kind: 'store'; storeId: string };

export const globalCatalogContext: CatalogContext = { kind: 'global' };

export function storeCatalogContext(storeId: string): CatalogContext {
  return { kind: 'store', storeId };
}

export function storeHomePath(storeId: string) {
  return `/store/${storeId}`;
}

export function catalogPath(context: CatalogContext, search = '') {
  return context.kind === 'store' ? `/store/${context.storeId}/catalog${search}` : `/${search}`;
}

export function productPath(context: CatalogContext, productId: number, search = '') {
  const path =
    context.kind === 'store'
      ? `/store/${context.storeId}/product/${productId}`
      : `/product/${productId}`;
  return `${path}${search}`;
}

export function isStoreContext(
  context: CatalogContext,
): context is Extract<CatalogContext, { kind: 'store' }> {
  return context.kind === 'store';
}
