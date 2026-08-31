import { expect, test, type Page } from '@playwright/test';

const groups = [
  { id: 17, parent_id: null, name: 'Vegetables', sort_order: 10, product_count: 12 },
  { id: 18, parent_id: null, name: 'Greens and Salads', sort_order: 20, product_count: 8 },
  { id: 19, parent_id: null, name: 'Fruit', sort_order: 30, product_count: 4 },
];

const manyGroups = Array.from({ length: 60 }, (_, index) => ({
  id: 30 + index,
  parent_id: null,
  name: `Category ${index + 1}`,
  sort_order: index,
  product_count: 1,
}));

const manyProducts = Array.from({ length: 24 }, (_, index) => ({
  id: 200 + index,
  name: `Product ${index + 1}`,
  min_price: '120.00',
  offer_count: 1,
  photos: [],
}));

const globalProducts = {
  products: [
    { id: 101, name: 'Milk', min_price: '120.00', offer_count: 2, photos: [] },
    { id: 102, name: 'Cheese', min_price: '220.00', offer_count: 1, photos: [] },
  ],
  page: 1,
  limit: 2,
  total: 6,
};

const storeProducts = {
  products: [
    {
      seller_product_id: 653,
      product_id: 169,
      name: 'Store Milk',
      catalog_name: 'Milk',
      group_id: 17,
      group_name: 'Vegetables',
      price: '125.00',
      unit: 'pcs',
      stock: '9.000',
      description: null,
      origin_country: null,
      supply_date: null,
      photos: [],
    },
  ],
  page: 1,
  limit: 1,
  total: 3,
};

async function mockCatalog(
  page: Page,
  options: { groups?: typeof groups; products?: typeof globalProducts.products; failGroupsNetwork?: boolean } = {},
) {
  const requests: string[] = [];
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    requests.push(`${url.pathname}${url.search}`);

    if (url.pathname.endsWith('/groups')) {
      if (options.failGroupsNetwork) {
        await route.abort('failed');
        return;
      }
      await route.fulfill({ json: { groups: options.groups ?? groups } });
      return;
    }

    if (url.pathname.endsWith('/sellers/6')) {
      await route.fulfill({
        json: {
          seller_id: 6,
          name: 'Dev marker',
          market: null,
          row: null,
          place: null,
          working_hours: null,
          short_description: null,
          phone: null,
          whatsapp: null,
        },
      });
      return;
    }

    if (url.pathname.endsWith('/sellers/6/products')) {
      if (url.searchParams.get('search') === 'empty') {
        await route.fulfill({ json: { ...storeProducts, products: [], total: 0 } });
        return;
      }
      await route.fulfill({
        json: url.searchParams.get('search') === 'single'
          ? { ...storeProducts, total: 1 }
          : storeProducts,
      });
      return;
    }

    if (url.pathname.endsWith('/products')) {
      if (url.searchParams.get('search') === 'empty') {
        await route.fulfill({ json: { ...globalProducts, products: [], total: 0 } });
        return;
      }
      await route.fulfill({
        json: url.searchParams.get('search') === 'single'
          ? { ...globalProducts, products: [globalProducts.products[0]], total: 1 }
          : { ...globalProducts, products: options.products ?? globalProducts.products },
      });
      return;
    }

    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found', details: [] } } });
  });
  return requests;
}

function lastProductRequest(requests: string[]) {
  return requests.filter((url) => url.includes('/products?')).at(-1) ?? '';
}

async function selectCategories(page: Page) {
  const toggle = page.getByTestId('catalog-category-toggle');
  if ((await toggle.count()) && (await toggle.getAttribute('aria-expanded')) !== 'true') {
    await toggle.click();
  }
  await page.getByRole('button', { name: 'Vegetables', exact: true }).click();
  await page.getByRole('button', { name: 'Greens and Salads', exact: true }).click();
}

test('Global Catalog keeps multi-category filters in URL through refresh, pagination and clear', async ({ page }) => {
  const requests = await mockCatalog(page);

  await page.goto('/');
  await expect(page.getByText('Milk')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Каталог' })).toHaveCount(0);

  await selectCategories(page);
  await expect(page).toHaveURL(/group_id=17%2C18|group_id=17,18/);
  expect(lastProductRequest(requests)).toContain('/api/v1/catalog/products?group_id=17,18');
  await expect(page.getByTestId('catalog-pagination')).toBeVisible();

  await page.reload();
  await page.getByTestId('catalog-category-toggle').click();
  await expect(page.getByRole('button', { name: 'Vegetables', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Greens and Salads', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('catalog-pagination').getByRole('button').last().click();
  await expect(page).toHaveURL(/group_id=17%2C18|group_id=17,18/);
  await expect(page).toHaveURL(/page=2/);

  await page.getByRole('button', { name: 'Очистить фильтры' }).click();
  await expect(page).not.toHaveURL(/group_id=/);
  await expect(page).toHaveURL(/sort=name/);
  await expect(page).toHaveURL(/page=1/);
});

test('Global Catalog reports /groups network failure independently from successful /products', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { __GM_TELEMETRY_EVENTS__: unknown[] }).__GM_TELEMETRY_EVENTS__ = [];
  });
  await mockCatalog(page, { failGroupsNetwork: true });

  await page.goto('/');
  await expect(page.getByText('Milk')).toBeVisible();
  await page.getByTestId('catalog-category-toggle').click();

  const events = await page.evaluate(() =>
    (window as unknown as { __GM_TELEMETRY_EVENTS__: Array<{ type: string; payload: { message?: string; context?: Record<string, unknown>; data?: Record<string, unknown> } }> }).__GM_TELEMETRY_EVENTS__,
  );

  expect(events.some((event) => event.type === 'breadcrumb' && event.payload.message === 'load_products:success')).toBe(true);
  expect(
    events.some(
      (event) =>
        event.type === 'exception' &&
        event.payload.context?.operation === 'load_groups' &&
        event.payload.context?.endpoint === '/groups' &&
        event.payload.context?.errorType === 'network',
    ),
  ).toBe(true);
});

test('Store Catalog sends one seller-scoped multi-category request and preserves filters with search/sort/page', async ({
  page,
}) => {
  const requests = await mockCatalog(page);

  await page.goto('/store/6/catalog?search=milk&sort=price&page=2');
  await expect(page.getByText('Store Milk')).toBeVisible();
  await expect(page.getByTestId('catalog-pagination')).toBeVisible();

  await selectCategories(page);
  await expect(page).toHaveURL(/search=milk/);
  await expect(page).toHaveURL(/sort=price/);
  await expect(page).toHaveURL(/page=1/);
  await expect(page).toHaveURL(/group_id=17%2C18|group_id=17,18/);
  expect(lastProductRequest(requests)).toContain('/api/v1/catalog/sellers/6/products?group_id=17,18');

  await page.reload();
  await expect(page).toHaveURL(/\/store\/6\/catalog/);
  await expect(page.getByRole('button', { name: 'Vegetables', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('catalog-pagination').getByRole('button').last().click();
  await expect(page).toHaveURL(/group_id=17%2C18|group_id=17,18/);
  await expect(page).toHaveURL(/page=2/);
});

test('Catalog hides pagination for one page and empty results', async ({ page }) => {
  await mockCatalog(page);

  await page.goto('/?search=single');
  await expect(page.getByText('Milk')).toBeVisible();
  await expect(page.getByTestId('catalog-pagination')).toBeHidden();

  await page.goto('/?search=empty');
  await expect(page.getByTestId('catalog-pagination')).toBeHidden();

  await page.goto('/store/6/catalog?search=single');
  await expect(page.getByText('Store Milk')).toBeVisible();
  await expect(page.getByTestId('catalog-pagination')).toBeHidden();

  await page.goto('/store/6/catalog?search=empty');
  await expect(page.getByTestId('catalog-pagination')).toBeHidden();
});

test('Global Catalog category panel opens compactly, scrolls internally and keeps URL filters', async ({ page }) => {
  await mockCatalog(page, { groups: manyGroups, products: manyProducts });

  await page.goto('/');
  await expect(page.getByTestId('catalog-category-toggle')).toHaveAttribute('aria-expanded', 'false');
  await expect(page.getByTestId('catalog-category-panel-body')).toBeHidden();

  await page.getByTestId('catalog-category-toggle').click();
  await expect(page.getByTestId('catalog-category-panel-body')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Category 1', exact: true })).toBeVisible();
  await expect(page.getByTestId('catalog-category-list')).toHaveJSProperty('scrollTop', 0);
  expect(await page.getByTestId('catalog-category-list').evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);
  const scrollY = await page.evaluate(() => window.scrollY);
  await page.getByTestId('catalog-category-list').hover();
  await page.mouse.wheel(0, 800);
  await expect(page.getByTestId('catalog-category-panel-body')).toBeVisible();
  expect(await page.evaluate(() => window.scrollY)).toBe(scrollY);

  await page.getByRole('button', { name: 'Category 1', exact: true }).click();
  await expect(page).toHaveURL(/group_id=30/);
  await expect(page.getByTestId('catalog-category-panel-body')).toBeVisible();

  const url = page.url();
  await page.getByRole('button', { name: 'Иконки' }).click();
  await expect(page.getByRole('button', { name: 'Category 2', exact: true })).toBeVisible();
  expect(page.url()).toBe(url);
});

test('Global Catalog category UI keeps selector chips and toggle synchronized', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockCatalog(page);

  await page.goto('/');
  await page.getByTestId('catalog-category-toggle').click();
  const idleVegetablesIconColor = await page.getByRole('button', { name: 'Vegetables', exact: true }).locator('.gm-catalog-category-icon').evaluate((node) => getComputedStyle(node).color);
  await page.getByRole('button', { name: 'Vegetables', exact: true }).click();
  const selectedIconColor = await page.getByRole('button', { name: 'Vegetables', exact: true }).locator('.gm-catalog-category-icon').evaluate((node) => getComputedStyle(node).color);
  expect(selectedIconColor).not.toBe(idleVegetablesIconColor);
  await expect(page.getByTestId('catalog-category-toggle')).toContainText('(1)');
  await expect(page.getByRole('button', { name: 'Vegetables ×', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vegetables', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.getByRole('button', { name: 'Иконки' }).click();
  await expect(page.getByTestId('catalog-category-toggle')).toHaveAccessibleName('Категории, выбрано 1');
  await expect(page.getByLabel('Убрать категорию Vegetables')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vegetables', exact: true })).toHaveAttribute('aria-pressed', 'true');
  const toggleBox = await page.getByTestId('catalog-category-toggle').boundingBox();
  const searchBox = await page.locator('.gm-buyer-search').boundingBox();
  expect(toggleBox).not.toBeNull();
  expect(searchBox).not.toBeNull();
  expect(Math.abs((toggleBox!.y + toggleBox!.height / 2) - (searchBox!.y + searchBox!.height / 2))).toBeLessThan(8);

  const beforeUrl = page.url();
  await page.getByRole('button', { name: 'Текст' }).click();
  expect(page.url()).toBe(beforeUrl);
  await expect(page.getByTestId('catalog-category-toggle')).toContainText('Категории');
  await expect(page.getByTestId('catalog-category-toggle')).toContainText('(1)');
});

test('Global Catalog category panel auto-collapses only when enabled', async ({ page }) => {
  await page.clock.install();
  await mockCatalog(page);

  await page.goto('/');
  await page.getByTestId('catalog-category-toggle').click();
  await expect(page.getByTestId('catalog-category-panel-body')).toBeVisible();
  await page.clock.fastForward(6000);
  await page.getByRole('button', { name: 'Vegetables', exact: true }).click();
  await page.clock.fastForward(1000);
  await expect(page.getByTestId('catalog-category-panel-body')).toBeVisible();
  await page.clock.fastForward(6000);
  await expect(page.getByTestId('catalog-category-panel-body')).toBeHidden();

  await page.getByTestId('catalog-category-toggle').click();
  await page.getByLabel('Автосворачивание').uncheck();
  await page.clock.fastForward(7000);
  await expect(page.getByTestId('catalog-category-panel-body')).toBeVisible();
});

test('Global Catalog category panel collapses on catalog scroll and keeps selected filters', async ({ page }) => {
  await mockCatalog(page, { products: manyProducts });

  await page.goto('/');
  await page.getByTestId('catalog-category-toggle').click();
  await page.getByRole('button', { name: 'Vegetables', exact: true }).click();
  await page.evaluate(() => window.scrollBy(0, 800));

  await expect(page.getByTestId('catalog-category-panel-body')).toBeHidden();
  await expect(page).toHaveURL(/group_id=17/);
});
