import { useEffect, useRef } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  useGreenMarketRuntime,
  useRuntimeInstance,
} from '@/platform-core/navigation-runtime-layer/hooks/useGreenMarketRuntime';
import { currentEntry } from '@/platform-core/navigation-runtime-layer/navigation/NavigationStack';
import { asSellerId } from '@/platform-core/contracts/Action';
import type { NavigationEntry, ScreenId } from '@/platform-core/navigation-runtime-layer/navigation/NavigationStack';

/**
 * Мост между реальным GreenMarketRuntime (стек экранов Platform Core) и
 * react-router (URL браузера). Platform Core сам по себе не знает про URL —
 * это намеренно (ТЗ не просит менять Navigation Layer), а React Router даёт
 * пользователю адресную строку и кнопку "назад" браузера, нужные веб-версии.
 *
 * Работает в обе стороны:
 *  - URL → Runtime: при заходе/смене пути извне (ссылка, адресная строка,
 *    кнопка "назад" браузера) синхронизирует стек через forceNavigate — это
 *    НЕ пользовательское действие из Action Catalog, поэтому не идёт через
 *    dispatch()/isActionAllowed() (см. GreenMarketRuntime.ts#forceNavigate).
 *  - Runtime → URL: при dispatch() внутриприкладного Action (OPEN_MAP,
 *    OPEN_SELLER_LIST, OPEN_CATALOG, BACK и т.д.) стек меняется, и этот
 *    компонент переносит изменение в URL, чтобы адресная строка не отставала.
 */
const PATH_TO_SCREEN: Record<string, ScreenId> = {
  '/': 'Catalog',
  '/catalog': 'Catalog',
  '/map': 'Map',
  '/seller-list': 'SellerList',
};

const SCREEN_TO_PATH: Partial<Record<ScreenId, string>> = {
  Catalog: '/catalog',
  Map: '/map',
  SellerList: '/seller-list',
};

function entryFromPath(pathname: string, sellerId?: string): NavigationEntry | null {
  if (pathname.startsWith('/seller/') && sellerId) {
    return { screen: 'SellerCard', params: { sellerId: asSellerId(sellerId) } };
  }
  const screen = PATH_TO_SCREEN[pathname];
  if (!screen) return null;
  return { screen, params: {} } as NavigationEntry;
}

function pathFromEntry(entry: NavigationEntry): string | null {
  if (entry.screen === 'SellerCard') {
    return `/seller/${entry.params.sellerId}`;
  }
  return SCREEN_TO_PATH[entry.screen] ?? null;
}

/** Рендерится один раз внутри BrowserRouter + GreenMarketRuntimeProvider,
 *  ничего не отображает — только синхронизирует состояние. */
export function RuntimeRouteSync() {
  const runtime = useRuntimeInstance();
  const { state } = useGreenMarketRuntime();
  const location = useLocation();
  const navigate = useNavigate();
  const params = useParams();
  const isSyncingFromUrl = useRef(false);

  // URL → Runtime
  useEffect(() => {
    const desired = entryFromPath(location.pathname, params.sellerId);
    if (!desired) return;
    const active = currentEntry(runtime.getState().navigation);
    const alreadyThere =
      active.screen === desired.screen && JSON.stringify(active.params) === JSON.stringify(desired.params);
    if (!alreadyThere) {
      isSyncingFromUrl.current = true;
      runtime.forceNavigate(desired);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- намеренно реагирует только на смену пути
  }, [location.pathname, params.sellerId]);

  // Runtime → URL
  useEffect(() => {
    if (isSyncingFromUrl.current) {
      isSyncingFromUrl.current = false;
      return;
    }
    const entry = currentEntry(state.navigation);
    const path = pathFromEntry(entry);
    if (path && path !== location.pathname) {
      navigate(path);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- намеренно реагирует только на смену состояния Runtime
  }, [state]);

  return null;
}
