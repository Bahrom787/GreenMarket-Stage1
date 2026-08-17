import { asSellerId } from '@/platform-core/contracts/Action';
import type {
  NavigationEntry,
  ScreenId,
} from '@/platform-core/navigation-runtime-layer/navigation/NavigationStack';

const PATH_TO_SCREEN: Record<string, ScreenId> = {
  '/catalog': 'Catalog',
  '/map': 'Map',
  '/seller-list': 'SellerList',
};

const SCREEN_TO_PATH: Partial<Record<ScreenId, string>> = {
  Catalog: '/catalog',
  Map: '/map',
  SellerList: '/seller-list',
};

export function entryFromPath(pathname: string, sellerId?: string): NavigationEntry | null {
  if (pathname.startsWith('/seller/') && sellerId) {
    return { screen: 'SellerCard', params: { sellerId: asSellerId(sellerId) } };
  }
  const screen = PATH_TO_SCREEN[pathname];
  if (!screen) return null;
  return { screen, params: {} } as NavigationEntry;
}

export function pathFromEntry(entry: NavigationEntry): string | null {
  if (entry.screen === 'SellerCard') {
    return `/seller/${entry.params.sellerId}`;
  }
  return SCREEN_TO_PATH[entry.screen] ?? null;
}

export function nextPathFromRuntime(pathname: string, entry: NavigationEntry): string | null {
  if (pathname === '/') return null;
  const path = pathFromEntry(entry);
  return path && path !== pathname ? path : null;
}
