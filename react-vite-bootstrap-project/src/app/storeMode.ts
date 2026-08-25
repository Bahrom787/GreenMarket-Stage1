export type StoreMode = { active: false } | { active: true; storeId: string };

const STORE_PATH_RE = /^\/store\/([^/]+)(?:\/|$)/;

function decodePathPart(value: string): string | null {
  try {
    return decodeURIComponent(value);
  } catch {
    return null;
  }
}

function hasGlobalStoreMode(search = '') {
  return new URLSearchParams(search).get('mode') === 'global';
}

export function storeModeFromPath(pathname: string, search = ''): StoreMode {
  if (hasGlobalStoreMode(search)) return { active: false };
  const match = pathname.match(STORE_PATH_RE);
  const storeId = match ? decodePathPart(match[1]) : null;
  return storeId ? { active: true, storeId } : { active: false };
}

export function storeModeAfterNavigation(current: StoreMode, pathname: string, search = ''): StoreMode {
  const routeMode = storeModeFromPath(pathname, search);
  if (!routeMode.active) return current;
  return current.active ? current : routeMode;
}

export function storeModeLandingPath(storeId: string): string {
  return `/store/${encodeURIComponent(storeId)}/catalog`;
}

export function isStoreModePathAllowed(pathname: string, storeId: string, search = ''): boolean {
  if (hasGlobalStoreMode(search)) return false;
  const match = pathname.match(/^\/store\/([^/]+)(.*)$/);
  if (!match || decodePathPart(match[1]) !== storeId) return false;

  return match[2] === '' || match[2] === '/catalog' || /^\/product\/[^/]+$/.test(match[2]);
}
