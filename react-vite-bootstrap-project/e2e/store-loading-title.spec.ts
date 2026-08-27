import { expect, test, type Page, type Route } from '@playwright/test';

const seller6 = {
  seller_id: 6,
  name: 'Dev marker',
  market: { id: 1, name: 'Dev market', type: 'SHOP', address: 'Kazan', latitude: null, longitude: null },
  row: 'A',
  place: '12',
  working_hours: '10-18',
  short_description: 'Greens only',
  phone: null,
  whatsapp: null,
};

const seller9 = {
  ...seller6,
  seller_id: 9,
  name: 'Second marker',
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

function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

async function fulfillStoreProducts(route: Route) {
  await route.fulfill({ json: { products: [storeProduct], page: 1, limit: 12, total: 1 } });
}

async function mockStoreCatalog(page: Page, sellers: Record<string, () => Promise<void> | void>) {
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());

    if (url.pathname.endsWith('/groups')) {
      await route.fulfill({
        json: { groups: [{ id: 17, parent_id: null, name: 'Vegetables', sort_order: 10, product_count: 1 }] },
      });
      return;
    }

    if (url.pathname.endsWith('/sellers/6/products') || url.pathname.endsWith('/sellers/9/products')) {
      await fulfillStoreProducts(route);
      return;
    }

    if (url.pathname.endsWith('/sellers/6')) {
      await sellers['6']?.();
      await route.fulfill({ json: seller6 });
      return;
    }

    if (url.pathname.endsWith('/sellers/9')) {
      await sellers['9']?.();
      await route.fulfill({ json: seller9 });
      return;
    }

    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found', details: [] } } });
  });
}

test('Store Catalog shows title skeleton while seller loads, then seller name', async ({ page }) => {
  const sellerLoaded = deferred();
  await mockStoreCatalog(page, { '6': () => sellerLoaded.promise });

  await page.goto('/store/6/catalog');
  await expect(page.getByTestId('store-catalog-title-skeleton')).toBeVisible();
  await expect(page.getByText('Каталог магазина')).toHaveCount(0);

  sellerLoaded.resolve();
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toBeVisible();
  await expect(page.getByTestId('store-catalog-title-skeleton')).toHaveCount(0);
});

test('Store Home keeps loading state while seller loads', async ({ page }) => {
  const sellerLoaded = deferred();
  await mockStoreCatalog(page, { '6': () => sellerLoaded.promise });

  await page.goto('/store/6');
  await expect(page.getByRole('status', { name: 'Загрузка магазина' })).toBeVisible();
  await expect(page.getByText('Каталог магазина')).toHaveCount(0);

  sellerLoaded.resolve();
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toBeVisible();
});

test('Store Catalog 404 shows not found without fallback title', async ({ page }) => {
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/groups')) {
      await route.fulfill({ json: { groups: [] } });
      return;
    }
    if (url.pathname.endsWith('/sellers/404/products')) {
      await fulfillStoreProducts(route);
      return;
    }
    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found', details: [] } } });
  });

  await page.goto('/store/404/catalog');
  await expect(page.getByRole('alert')).toContainText('Магазин не найден');
  await expect(page.getByText('Каталог магазина')).toHaveCount(0);
});

test('Store Catalog generic seller error keeps retryable error state', async ({ page }) => {
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/groups')) {
      await route.fulfill({ json: { groups: [] } });
      return;
    }
    if (url.pathname.endsWith('/sellers/6/products')) {
      await fulfillStoreProducts(route);
      return;
    }
    await route.fulfill({
      status: 500,
      json: { error: { code: 'SERVER_ERROR', message: 'Server down', details: [] } },
    });
  });

  await page.goto('/store/6/catalog');
  await expect(page.getByRole('alert')).toContainText('Не удалось загрузить каталог');
  await expect(page.getByRole('alert')).toContainText('Server down');
  await expect(page.getByRole('button', { name: 'Повторить' })).toBeVisible();
});

test('Store Catalog does not show previous seller name while another store loads', async ({ page }) => {
  const seller9Loaded = deferred();
  await mockStoreCatalog(page, { '9': () => seller9Loaded.promise });

  await page.goto('/store/6/catalog');
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toBeVisible();

  await page.goto('/store/9/catalog');
  await expect(page.getByTestId('store-catalog-title-skeleton')).toBeVisible();
  await expect(page.getByText('Dev marker')).toHaveCount(0);

  seller9Loaded.resolve();
  await expect(page.getByRole('heading', { name: 'Second marker' })).toBeVisible();
});
