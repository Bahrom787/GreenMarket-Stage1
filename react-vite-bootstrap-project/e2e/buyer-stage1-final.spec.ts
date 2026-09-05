import { expect, test, type Page } from '@playwright/test';

const market = {
  id: 1,
  name: 'Dev market',
  type: 'SHOP',
  address: 'Kazan',
  latitude: '55.7',
  longitude: '49.1',
};

const seller = {
  seller_id: 6,
  name: 'Dev marker',
  market,
  row: 'A',
  place: '12',
  working_hours: '10-18',
  short_description: 'Greens only',
  phone: null,
  whatsapp: null,
};

const secondSeller = {
  ...seller,
  seller_id: 9,
  name: 'Second marker',
  row: 'B',
  place: '21',
};

const storeProduct = {
  seller_product_id: 653,
  product_id: 169,
  name: 'Store Apple',
  catalog_name: 'Apple',
  group_id: 17,
  group_name: 'Vegetables',
  price: '125.00',
  unit: 'pcs',
  stock: '9.000',
  description: null,
  origin_country: null,
  supply_date: null,
  photos: [],
};

const secondStoreProduct = {
  ...storeProduct,
  seller_product_id: 654,
  name: 'Second Store Apple',
  price: '130.00',
};

async function mockBuyerApi(page: Page) {
  const requests: string[] = [];
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    requests.push(`${url.pathname}${url.search}`);

    if (url.pathname.endsWith('/groups')) {
      await route.fulfill({
        json: {
          groups: [
            { id: 17, parent_id: null, name: 'Vegetables', sort_order: 10, product_count: 12 },
            { id: 18, parent_id: null, name: 'Greens and Salads', sort_order: 20, product_count: 8 },
          ],
        },
      });
      return;
    }

    if (url.pathname.endsWith('/markets')) {
      await route.fulfill({ json: { markets: [market] } });
      return;
    }

    if (url.pathname.endsWith('/markets/1/sellers')) {
      await route.fulfill({
        json: {
          sellers: [
            { ...seller, market: undefined, product_count: 12 },
            { seller_id: 7, name: 'Fruit seller', row: null, place: null, working_hours: null, short_description: null, product_count: 3 },
          ],
        },
      });
      return;
    }

    if (url.pathname.endsWith('/products/169')) {
      await route.fulfill({
        json: {
          id: 169,
          name: 'Global Apple',
          description: null,
          group_id: 17,
          group_name: 'Vegetables',
          offers: [
            {
              seller_product_id: 653,
              seller_id: 6,
              seller_name: 'Dev marker',
              price: '125.00',
              unit: 'pcs',
              stock: '9.000',
              description: null,
              origin_country: null,
              supply_date: null,
              photos: [],
            },
            {
              seller_product_id: 654,
              seller_id: 9,
              seller_name: 'Second marker',
              price: '130.00',
              unit: 'pcs',
              stock: '4.000',
              description: null,
              origin_country: null,
              supply_date: null,
              photos: [],
            },
          ],
        },
      });
      return;
    }

    if (url.pathname.endsWith('/sellers/6/products')) {
      await route.fulfill({ json: { products: [storeProduct], page: Number(url.searchParams.get('page') ?? 1), limit: 1, total: 3 } });
      return;
    }

    if (url.pathname.endsWith('/sellers/9/products')) {
      await route.fulfill({ json: { products: [secondStoreProduct], page: Number(url.searchParams.get('page') ?? 1), limit: 1, total: 1 } });
      return;
    }

    if (url.pathname.endsWith('/sellers/6')) {
      await route.fulfill({ json: seller });
      return;
    }

    if (url.pathname.endsWith('/sellers/9')) {
      await route.fulfill({ json: secondSeller });
      return;
    }

    if (url.pathname.endsWith('/products')) {
      await route.fulfill({
        json: {
          products: [{ id: 169, name: 'Global Apple', min_price: '125.00', offer_count: 2, photos: [] }],
          page: Number(url.searchParams.get('page') ?? 1),
          limit: 1,
          total: 3,
        },
      });
      return;
    }

    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found', details: [] } } });
  });
  return requests;
}

function lastProductRequest(requests: string[]) {
  return requests.filter((request) => request.includes('/products?')).at(-1) ?? '';
}

async function pushRoute(page: Page, path: string) {
  await page.evaluate((next) => {
    window.history.pushState({}, '', next);
    window.dispatchEvent(new PopStateEvent('popstate'));
  }, path);
}

test('Global Catalog -> Product -> Store Global preserves URL context and history', async ({ page }) => {
  const requests = await mockBuyerApi(page);

  await page.goto('/?search=apple&group_id=17,18&sort=price&page=1');
  await expect(page.getByRole('button', { name: /Global Apple/ })).toBeVisible();
  expect(lastProductRequest(requests)).toContain('/api/v1/catalog/products?group_id=17,18&search=apple&sort=price&page=1');

  await page.getByRole('button', { name: /Global Apple/ }).click();
  await expect(page).toHaveURL(/\/product\/169/);
  await expect(page).toHaveURL(/group_id=17%2C18|group_id=17,18/);
  await expect(page.getByRole('heading', { name: 'Global Apple' })).toBeVisible();
  await expect(page.locator('.gm-buyer-offer-card__store-link')).toHaveCount(2);

  await page.locator('.gm-buyer-offer-card__store-link').first().click();
  await expect(page).toHaveURL('/store/6?mode=global');
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toBeVisible();
  await page.locator('.gm-store-home button').click();
  await expect(page).toHaveURL('/store/6/catalog?mode=global');

  await page.goBack();
  await expect(page).toHaveURL(/\/product\/169/);
  await page.goForward();
  await expect(page).toHaveURL('/store/6/catalog?mode=global');

  await page.getByRole('button', { name: /Store Apple/ }).click();
  await expect(page).toHaveURL(/\/store\/6\/product\/169\?mode=global&seller_product_id=653/);
  await page.goBack();
  await expect(page).toHaveURL('/store/6/catalog?mode=global');
  await page.goBack();
  await expect(page).toHaveURL(/\/product\/169/);

  await page.locator('.gm-buyer-offer-card__store-link').nth(1).click();
  await expect(page).toHaveURL('/store/9?mode=global');
  await expect(page.getByRole('heading', { name: 'Second marker' })).toBeVisible();
  await page.locator('.gm-store-home button').click();
  await expect(page).toHaveURL('/store/9/catalog?mode=global');
  await page.goBack();
  await expect(page).toHaveURL(/\/product\/169/);

  await page.locator('.gm-site-nav__link[href="/"]').click();
  await expect(page).toHaveURL('/');
  await page.goBack();
  await expect(page).toHaveURL(/\/product\/169/);

  await page.locator('.gm-buyer-offer-card__store-link').first().click();
  await page.locator('.gm-store-home button').click();
  await page.getByRole('button', { name: /Store Apple/ }).click();
  await page.reload();
  await expect(page).toHaveURL(/\/store\/6\/product\/169\?mode=global&seller_product_id=653/);
  await expect(page.getByRole('heading', { name: 'Store Apple' })).toBeVisible();
});

test('Store Mode keeps store routes isolated through catalog, product, back and forbidden routes', async ({ page }) => {
  await mockBuyerApi(page);

  await page.goto('/store/6');
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toBeVisible();
  await page.locator('.gm-store-home button').click();
  await expect(page).toHaveURL('/store/6/catalog');

  await page.getByRole('button', { name: /Store Apple/ }).click();
  await expect(page).toHaveURL('/store/6/product/169?seller_product_id=653');
  await page.goBack();
  await expect(page).toHaveURL('/store/6/catalog');
  await page.goBack();
  await expect(page).toHaveURL('/store/6');

  await pushRoute(page, '/');
  await expect(page).toHaveURL('/store/6/catalog');
  await pushRoute(page, '/store/7');
  await expect(page).toHaveURL('/store/6/catalog');
  await pushRoute(page, '/store/6?mode=global');
  await expect(page).toHaveURL('/store/6/catalog');
});

test('Store Catalog preserves seller scope and filters through product, back, forward and refresh', async ({ page }) => {
  const requests = await mockBuyerApi(page);

  await page.goto('/store/6/catalog?search=apple&group_id=17,18&sort=price&page=2');
  await expect(page.getByRole('button', { name: /Store Apple/ })).toBeVisible();
  expect(lastProductRequest(requests)).toContain('/api/v1/catalog/sellers/6/products?group_id=17,18&search=apple&sort=price&page=2');

  await page.reload();
  await expect(page).toHaveURL(/search=apple/);
  await expect(page).toHaveURL(/group_id=17%2C18|group_id=17,18/);
  await expect(page).toHaveURL(/sort=price/);
  await expect(page).toHaveURL(/page=2/);

  await page.getByRole('button', { name: /Store Apple/ }).click();
  await expect(page).toHaveURL(/\/store\/6\/product\/169/);
  await expect(page).toHaveURL(/seller_product_id=653/);
  await page.goBack();
  await expect(page).toHaveURL(/\/store\/6\/catalog/);
  await expect(page).toHaveURL(/group_id=17%2C18|group_id=17,18/);
  await page.goForward();
  await expect(page).toHaveURL(/\/store\/6\/product\/169/);
});

test('Seller List and Map entry keep Buyer navigation on React routes', async ({ page }) => {
  await mockBuyerApi(page);

  await page.goto('/seller-list?search=marker');
  await expect(page.getByTestId('seller-list-row-6')).toBeVisible();
  await page.getByTestId('seller-list-row-6').click();
  await page.getByTestId('seller-list-show-products').click();
  await expect(page).toHaveURL('/?seller_id=6');
  await page.goBack();
  await expect(page).toHaveURL(/\/seller-list\?search=marker&seller_id=6|\/seller-list\?seller_id=6&search=marker/);

  await page.goto('/map');
  await expect(page.getByTestId('map-screen')).toBeVisible();
  await page.getByTestId('fab-panel-toggle').click();
  await page.getByTestId('open-catalog').click();
  await expect(page).toHaveURL('/');
});

test('Map Screen keeps header sections separated and FAB inside viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockBuyerApi(page);

  await page.goto('/map');
  await expect(page.getByTestId('map-screen')).toBeVisible();
  await expect(page.locator('.gm-site-header')).toContainText('Green Board');
  await expect(page.locator('.gm-site-nav__link--active')).toHaveText('Карта');
  await expect(page.getByTestId('map-controls')).not.toContainText('Green Board');

  async function expectMapLayoutFits() {
    const entitySwitch = await page.locator('.gm-search-filter-bar__entity-switch').boundingBox();
    const search = await page.locator('.gm-map-search-slot').boundingBox();
    const input = await page.getByTestId('map-search').boundingBox();
    const actions = await page.locator('.gm-search-filter-bar__actions').boundingBox();
    expect(entitySwitch).not.toBeNull();
    expect(search).not.toBeNull();
    expect(input).not.toBeNull();
    expect(actions).not.toBeNull();
    expect(entitySwitch!.x + entitySwitch!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(search!.x + search!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    expect(actions!.x + actions!.width).toBeLessThanOrEqual(page.viewportSize()!.width);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
  }

  await expectMapLayoutFits();
  await page.locator('.gm-search-filter-bar__entity-option').nth(1).click();
  await expect(page.getByTestId('map-search')).toHaveAttribute('placeholder', 'Найти товар');
  await page.locator('.gm-search-filter-bar__entity-option').first().click();
  await expect(page.getByTestId('map-search')).toHaveAttribute('placeholder', 'Найти продавца');

  await page.getByTestId('map-category-toggle').click();
  const filter = page.getByTestId('search-filter-panel-categories');
  await expect(filter).toBeVisible();
  let filterBox = await filter.boundingBox();
  expect(filterBox).not.toBeNull();
  expect(filterBox!.x).toBeGreaterThanOrEqual(0);
  expect(filterBox!.y).toBeGreaterThanOrEqual(0);
  expect(filterBox!.x + filterBox!.width).toBeLessThanOrEqual(390);
  expect(filterBox!.y + filterBox!.height).toBeLessThanOrEqual(844);
  await page.keyboard.press('Escape');
  await expect(filter).toBeHidden();

  await page.getByTestId('fab-panel-toggle').click();
  const panel = page.getByTestId('fab-panel');
  await expect(panel).toBeVisible();
  for (const testId of ['toggle-map-pois', 'open-catalog', 'open-seller-search', 'center-on-user', 'toggle-fullscreen', 'toggle-theme']) {
    await expect(page.getByTestId(testId)).toBeVisible();
  }
  let box = await panel.boundingBox();
  expect(box).not.toBeNull();

  await page.mouse.move(box!.x + box!.width - 4, box!.y + box!.height - 4);
  await page.mouse.down();
  await page.mouse.move(900, 1400);
  await page.mouse.up();

  box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(390);
  expect(box!.y + box!.height).toBeLessThanOrEqual(844);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expectMapLayoutFits();
  await page.getByTestId('map-category-toggle').click();
  filterBox = await filter.boundingBox();
  expect(filterBox).not.toBeNull();
  expect(filterBox!.x).toBeGreaterThanOrEqual(0);
  expect(filterBox!.y).toBeGreaterThanOrEqual(0);
  expect(filterBox!.x + filterBox!.width).toBeLessThanOrEqual(1440);
  expect(filterBox!.y + filterBox!.height).toBeLessThanOrEqual(900);
  await page.keyboard.press('Escape');
  box = await panel.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.y).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(1440);
  expect(box!.y + box!.height).toBeLessThanOrEqual(900);
});

test('Global Catalog, Seller List and Map share the SearchFilterBar structure', async ({ page }) => {
  await mockBuyerApi(page);

  async function expectInOneBar(selectors: string[]) {
    const bar = page.locator('.gm-search-filter-bar').first();
    await expect(bar).toBeVisible();
    await expect(page.locator('.gm-search-filter-bar')).toHaveCount(1);
    for (const selector of selectors) {
      await expect(bar.locator(selector)).toBeVisible();
    }
  }

  await page.goto('/');
  await expectInOneBar([
    '.gm-search-filter-bar__search',
    '[data-testid="catalog-category-toggle"]',
    '[data-testid="catalog-seller-toggle"]',
    '[data-testid="catalog-state-toggle"]',
  ]);
  await expect(page.locator('.gm-search-filter-bar').first().locator('.gm-search-filter-bar__sort button')).toHaveCount(2);

  await page.goto('/seller-list');
  await expectInOneBar([
    '.gm-search-filter-bar__search',
    '[data-testid="seller-list-category-toggle"]',
    '[data-testid="search-filter-group-sellers"]',
    '[data-testid="seller-list-state-toggle"]',
    '[data-testid="seller-list-search"]',
    '[data-testid="seller-list-show-products"]',
  ]);

  await page.goto('/map');
  await expectInOneBar([
    '.gm-search-filter-bar__search',
    '.gm-search-filter-bar__entity-switch',
    '[data-testid="map-category-toggle"]',
    '[data-testid="map-state-toggle"]',
  ]);
});

test('SearchFilterBar keeps one slot order across screens', async ({ page }) => {
  await mockBuyerApi(page);

  async function slotNames() {
    return page.locator('.gm-search-filter-bar__row').first().evaluate((row) =>
      Array.from(row.children).map((node) => {
        const className = (node as HTMLElement).className;
        if (className.includes('__search')) return 'search';
        if (className.includes('__entity-switch')) return 'entity';
        if (className.includes('__trigger')) return 'filter';
        if (className.includes('__actions')) return 'actions';
        if (className.includes('__sort')) return 'sort';
        return 'other';
      }),
    );
  }

  await page.goto('/');
  expect(await slotNames()).toEqual(['search', 'filter', 'filter', 'filter', 'sort']);

  await page.goto('/seller-list');
  expect(await slotNames()).toEqual(['search', 'filter', 'filter', 'filter', 'actions']);

  await page.goto('/map');
  expect(await slotNames()).toEqual(['search', 'entity', 'filter', 'filter', 'actions']);
});

test('SearchFilterBar uses one layout model across Global screens', async ({ page }) => {
  await mockBuyerApi(page);

  for (const width of [360, 390, 412, 768, 1440]) {
    await page.setViewportSize({ width, height: width >= 768 ? 900 : 844 });
    const searchHeights: number[] = [];
    const triggerHeights: number[] = [];
    for (const path of ['/', '/seller-list', '/map']) {
      await page.goto(path);
      const bar = page.locator('.gm-search-filter-bar').first();
      await expect(bar).toBeVisible();
      await expect(page.locator('.gm-search-filter-bar')).toHaveCount(1);
      await expect(bar.locator('.gm-search-filter-bar__search')).toBeVisible();
      await expect(bar.locator('.gm-search-filter-bar__trigger').first()).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
        .toBe(true);
      const metrics = await bar.evaluate((node) => {
        const search = node.querySelector('.gm-search-filter-bar__search')?.getBoundingClientRect();
        const trigger = node.querySelector('.gm-search-filter-bar__trigger')?.getBoundingClientRect();
        const row = node.querySelector('.gm-search-filter-bar__row')?.getBoundingClientRect();
        return {
          searchHeight: Math.round(search?.height ?? 0),
          triggerHeight: Math.round(trigger?.height ?? 0),
          rowTop: Math.round(row?.top ?? 0),
          searchTop: Math.round(search?.top ?? 0),
        };
      });
      searchHeights.push(metrics.searchHeight);
      triggerHeights.push(metrics.triggerHeight);
      expect(metrics.searchTop).toBe(metrics.rowTop);

      const collapsed = await bar.boundingBox();
      await bar.locator('.gm-search-filter-bar__trigger').first().click();
      const panel = bar.locator('.gm-search-filter-bar__panel');
      await expect(panel).toBeVisible();
      const expanded = await bar.boundingBox();
      expect(collapsed).not.toBeNull();
      expect(expanded).not.toBeNull();
      expect(expanded!.height).toBeGreaterThan(collapsed!.height);

      if (path === '/map') {
        const panelBox = await panel.boundingBox();
        const contentBox = await page.locator('main').boundingBox();
        expect(panelBox).not.toBeNull();
        expect(contentBox).not.toBeNull();
        expect(panelBox!.y + panelBox!.height).toBeLessThanOrEqual(contentBox!.y);
      }
    }
    expect(new Set(searchHeights).size).toBe(1);
    expect(new Set(triggerHeights).size).toBe(1);
  }
});

test('SearchFilterBar keeps compact trigger geometry on narrow screens', async ({ page }) => {
  await mockBuyerApi(page);

  for (const width of [360, 390, 412]) {
    await page.setViewportSize({ width, height: 844 });
    for (const path of ['/', '/seller-list', '/map']) {
      await page.goto(path);
      const bar = page.locator('.gm-search-filter-bar').first();
      const barBox = await bar.boundingBox();
      expect(barBox).not.toBeNull();
      const triggerBoxes = await bar.locator('.gm-search-filter-bar__trigger').evaluateAll((nodes) =>
        nodes.map((node) => {
          const rect = node.getBoundingClientRect();
          return { width: rect.width, height: rect.height };
        }),
      );
      expect(triggerBoxes.length).toBeGreaterThan(0);
      for (const box of triggerBoxes) {
        expect(box.width).toBeLessThan(barBox!.width * 0.8);
        expect(box.height).toBe(36);
      }
    }
  }
});

test('Map SearchFilterBar persists selected filters through shared storage', async ({ page }) => {
  await mockBuyerApi(page);

  await page.goto('/map');
  await page.getByTestId('map-category-toggle').click();
  const category = page.getByTestId('map-category-list').getByRole('button').first();
  await expect(category).toBeVisible();
  const categoryName = await category.textContent();
  await category.click();
  await page.getByTestId('map-state-toggle').click();
  await page.getByTestId('map-state-filter-open').click();

  await expect
    .poll(() =>
      page.evaluate(() => {
        const stored = JSON.parse(localStorage.getItem('gm.searchFilterBar.filters.v1') ?? '{}') as { mapFilters?: Record<string, string[]> };
        return `${stored.mapFilters?.category?.length ?? 0}:${stored.mapFilters?.state?.join(',') ?? ''}`;
      }),
    )
    .toBe('1:open');

  await page.reload();
  await page.getByTestId('map-category-toggle').click();
  await expect(page.getByRole('button', { name: categoryName?.trim() ?? '' }).first()).toHaveAttribute('aria-pressed', 'true');
  await page.getByTestId('map-state-toggle').click();
  await expect(page.getByTestId('map-state-filter-open')).toHaveAttribute('aria-pressed', 'true');
});

test('Map tool buttons keep one shared size', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockBuyerApi(page);

  await page.goto('/map');
  await page.getByTestId('fab-panel-toggle').click();
  const buttons = [
    page.getByTestId('legend-toggle'),
    page.getByTestId('fab-panel-toggle'),
    page.getByTestId('toggle-map-pois'),
    page.getByTestId('open-catalog'),
    page.getByTestId('open-seller-search'),
    page.getByTestId('center-on-user'),
    page.getByTestId('toggle-fullscreen'),
    page.getByTestId('toggle-theme'),
  ];
  for (const button of buttons) {
    const box = await button.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(48);
    expect(box!.height).toBe(48);
  }
});
