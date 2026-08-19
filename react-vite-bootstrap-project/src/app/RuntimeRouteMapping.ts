import { asProductId, asSellerId } from '@/platform-core/contracts/Action';
import type {
  NavigationEntry,
  ScreenId,
} from '@/platform-core/navigation-runtime-layer/navigation/NavigationStack';

const PATH_TO_SCREEN: Record<string, ScreenId> = {
  '/': 'Catalog',
  '/catalog': 'Catalog',
  '/map': 'Map',
  '/seller-list': 'SellerList',
};

const SCREEN_TO_PATH: Partial<Record<ScreenId, string>> = {
  Catalog: '/',
  Map: '/map',
  SellerList: '/seller-list',
};

function isGlobalProductPath(pathname: string) {
  return /^\/product\/[^/]+$/.test(pathname);
}

export function entryFromPath(pathname: string): NavigationEntry | null {
  const storeHome = pathname.match(/^\/store\/([^/]+)$/)?.[1];
  if (storeHome) {
    return { screen: 'StoreHome', params: { storeId: asSellerId(storeHome) } };
  }
  const sellerId = pathname.match(/^\/seller\/([^/]+)$/)?.[1];
  if (sellerId) {
    return { screen: 'SellerCard', params: { sellerId: asSellerId(sellerId) } };
  }
  const storeCatalog = pathname.match(/^\/store\/([^/]+)\/catalog$/)?.[1];
  if (storeCatalog) {
    return { screen: 'SellerCatalog', params: { sellerId: asSellerId(storeCatalog) } };
  }
  const storeProduct = pathname.match(/^\/store\/([^/]+)\/product\/([^/]+)$/);
  if (storeProduct) {
    return {
      screen: 'ProductCard',
      params: { sellerId: asSellerId(storeProduct[1]), productId: asProductId(storeProduct[2]) },
    };
  }
  const screen = PATH_TO_SCREEN[pathname];
  if (!screen) return null;
  return { screen, params: {} } as NavigationEntry;
}

export function pathFromEntry(entry: NavigationEntry): string | null {
  if (entry.screen === 'StoreHome') {
    return `/store/${entry.params.storeId}`;
  }
  if (entry.screen === 'SellerCard') {
    return `/seller/${entry.params.sellerId}`;
  }
  if (entry.screen === 'SellerCatalog') {
    const category = entry.params.categoryId ? `?group_id=${entry.params.categoryId}` : '';
    return `/store/${entry.params.sellerId}/catalog${category}`;
  }
  if (entry.screen === 'ProductCard') {
    return `/store/${entry.params.sellerId}/product/${entry.params.productId}`;
  }
  return SCREEN_TO_PATH[entry.screen] ?? null;
}

export function nextPathFromRuntime(pathname: string, entry: NavigationEntry): string | null {
  if (entry.screen === 'Catalog' && isGlobalProductPath(pathname)) return null;

  const path = pathFromEntry(entry);
  return path && path !== pathname ? path : null;
}
