import { describe, expect, it } from 'vitest';
import {
  isStoreModePathAllowed,
  storeModeAfterNavigation,
  storeModeFromPath,
  storeModeLandingPath,
} from '@/app/storeMode';

describe('store mode routing', () => {
  it('activates only on store paths', () => {
    expect(storeModeFromPath('/')).toEqual({ active: false });
    expect(storeModeFromPath('/map')).toEqual({ active: false });
    expect(storeModeFromPath('/store/123')).toEqual({ active: true, storeId: '123' });
    expect(storeModeFromPath('/store/123/catalog')).toEqual({ active: true, storeId: '123' });
  });

  it('allows only same-store routes while active', () => {
    expect(isStoreModePathAllowed('/store/123', '123')).toBe(true);
    expect(isStoreModePathAllowed('/store/123/catalog', '123')).toBe(true);
    expect(isStoreModePathAllowed('/store/123/product/456', '123')).toBe(true);

    expect(isStoreModePathAllowed('/', '123')).toBe(false);
    expect(isStoreModePathAllowed('/map', '123')).toBe(false);
    expect(isStoreModePathAllowed('/seller-list', '123')).toBe(false);
    expect(isStoreModePathAllowed('/product/456', '123')).toBe(false);
    expect(isStoreModePathAllowed('/seller/999', '123')).toBe(false);
    expect(isStoreModePathAllowed('/store/999/catalog', '123')).toBe(false);
    expect(isStoreModePathAllowed('/store/999/product/456', '123')).toBe(false);
  });

  it('matches encoded store ids without switching stores implicitly', () => {
    expect(storeModeFromPath('/store/seller%201/catalog')).toEqual({
      active: true,
      storeId: 'seller 1',
    });
    expect(isStoreModePathAllowed('/store/seller%201/catalog', 'seller 1')).toBe(true);
    expect(isStoreModePathAllowed('/store/seller%202/catalog', 'seller 1')).toBe(false);
    expect(storeModeLandingPath('seller 1')).toBe('/store/seller%201/catalog');
  });

  it('uses store catalog as the canonical redirect target', () => {
    expect(storeModeLandingPath('123')).toBe('/store/123/catalog');
  });

  it('keeps the first store mode active for the current session', () => {
    const entered = storeModeAfterNavigation({ active: false }, '/store/123');
    expect(entered).toEqual({ active: true, storeId: '123' });

    expect(storeModeAfterNavigation(entered, '/')).toEqual(entered);
    expect(storeModeAfterNavigation(entered, '/store/999')).toEqual(entered);
  });

  it('restores store mode from direct store urls after refresh', () => {
    expect(storeModeFromPath('/store/123/product/456')).toEqual({
      active: true,
      storeId: '123',
    });
  });
});
