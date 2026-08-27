import { expect, test, type Page, type Route } from '@playwright/test';

const market = {
  id: 1,
  name: 'Dev market',
  type: 'SHOP',
  address: 'Kazan',
  latitude: '55.7',
  longitude: '49.1',
};

const sellers = [
  {
    seller_id: 6,
    name: 'Dev marker',
    row: 'A',
    place: '12',
    working_hours: '10-18',
    short_description: 'Greens only',
    product_count: 12,
  },
  {
    seller_id: 7,
    name: 'Fruit seller',
    row: null,
    place: null,
    working_hours: null,
    short_description: null,
    product_count: 4,
  },
];

const sellerProducts = {
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
  limit: 12,
  total: 1,
};

async function mockSellerList(page: Page, options: { failFirstMarkets?: boolean; emptyMarkets?: boolean } = {}) {
  const requests: string[] = [];
  let marketsCalls = 0;

  await page.route('**/api/v1/catalog/**', async (route: Route) => {
    const url = new URL(route.request().url());
    requests.push(`${url.pathname}${url.search}`);

    if (url.pathname.endsWith('/markets')) {
      marketsCalls += 1;
      if (options.failFirstMarkets && marketsCalls <= 2) {
        await route.fulfill({
          status: 500,
          json: { error: { code: 'SERVER_ERROR', message: 'Server error', details: [] } },
        });
        return;
      }
      await route.fulfill({ json: { markets: options.emptyMarkets ? [] : [market] } });
      return;
    }

    if (url.pathname.endsWith('/groups')) {
      await route.fulfill({ json: { groups: [] } });
      return;
    }

    if (url.pathname.endsWith('/markets/1/sellers')) {
      await route.fulfill({ json: { sellers } });
      return;
    }

    if (url.pathname.endsWith('/sellers/6/products')) {
      await route.fulfill({ json: sellerProducts });
      return;
    }

    if (url.pathname.endsWith('/sellers/6')) {
      await route.fulfill({
        json: {
          seller_id: 6,
          name: 'Dev marker',
          market,
          row: 'A',
          place: '12',
          working_hours: '10-18',
          short_description: 'Greens only',
          phone: null,
          whatsapp: null,
        },
      });
      return;
    }

    if (url.pathname.endsWith('/products')) {
      await route.fulfill({
        json: {
          products: [{ id: 169, name: 'Global Milk', min_price: '125.00', offer_count: 2, photos: [] }],
          page: 1,
          limit: 24,
          total: 1,
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

test('Seller List selects sellers, opens Global Catalog filter and browser Back restores state', async ({ page }) => {
  const requests = await mockSellerList(page);

  await page.goto('/seller-list');
  await expect(page.getByTestId('seller-list-row-6')).toBeVisible();
  await expect(page.getByRole('link', { name: 'Продавцы' })).toHaveClass(/gm-site-nav__link--active/);

  await page.getByTestId('seller-list-search').fill('marker');
  await expect(page).toHaveURL(/search=marker/);
  await expect(page.getByTestId('seller-list-row-6')).toBeVisible();
  await expect(page.getByTestId('seller-list-row-7')).toBeHidden();

  await page.getByTestId('seller-list-row-6').click();
  await expect(page.getByTestId('seller-list-row-6')).toHaveAttribute('aria-selected', 'true');
  await expect(page).toHaveURL(/seller_id=6/);

  await page.getByTestId('seller-list-search').fill('');
  await expect(page.getByTestId('seller-list-row-7')).toBeVisible();
  await page.getByTestId('seller-list-row-7').click();
  await expect(page).toHaveURL(/seller_id=6%2C7|seller_id=6,7/);
  await page.reload();
  await expect(page.getByTestId('seller-list-row-6')).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByTestId('seller-list-row-7')).toHaveAttribute('aria-selected', 'true');

  await page.getByTestId('seller-list-search').fill('fruit');
  await expect(page.getByTestId('seller-list-row-6')).toBeHidden();
  await expect(page.getByText(/выбрано: 2/)).toBeVisible();

  await page.getByTestId('seller-list-show-products').click();
  await expect(page).toHaveURL(/\/\?seller_id=6%2C7|\/\?seller_id=6,7/);
  expect(lastProductRequest(requests)).toContain('/api/v1/catalog/products?seller_id=6,7');

  await page.goBack();
  await expect(page).toHaveURL(/\/seller-list/);
  await expect(page.getByTestId('seller-list-search')).toHaveValue('fruit');
  await expect(page.getByText(/выбрано: 2/)).toBeVisible();
  expect(requests).not.toContain('/api/v1/catalog/map');
});

test('Seller List without selection opens Global Catalog without seller filter', async ({ page }) => {
  await mockSellerList(page);

  await page.goto('/seller-list');
  await expect(page.getByTestId('seller-list-row-6')).toBeVisible();
  await page.getByTestId('seller-list-show-products').click();
  await expect(page).toHaveURL('/');
});

test('Map to Seller List returns to Map through browser Back', async ({ page }) => {
  await mockSellerList(page);

  await page.goto('/map');
  await page.locator('.gm-icon-button').first().click();
  await expect(page).toHaveURL('/seller-list');
  await page.goBack();
  await expect(page).toHaveURL('/map');
});

test('Seller List shows error and retry state', async ({ page }) => {
  await mockSellerList(page, { failFirstMarkets: true });

  await page.goto('/seller-list');
  await expect(page.getByRole('alert')).toBeVisible();
  await page.getByRole('button', { name: 'Повторить' }).click();
  await expect(page.getByTestId('seller-list-row-6')).toBeVisible();
});

test('Seller List shows empty and empty search states', async ({ page }) => {
  await mockSellerList(page, { emptyMarkets: true });

  await page.goto('/seller-list');
  await expect(page.getByText('Продавцы не найдены')).toBeVisible();

  await page.unroute('**/api/v1/catalog/**');
  await mockSellerList(page);
  await page.goto('/seller-list');
  await page.getByTestId('seller-list-search').fill('missing');
  await expect(page.getByText('Ничего не найдено')).toBeVisible();
});

test('Seller List ignores stale load results after search changes', async ({ page }) => {
  let marketCalls = 0;
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/markets')) {
      marketCalls += 1;
      if (marketCalls <= 2) await new Promise((resolve) => setTimeout(resolve, 600));
      await route.fulfill({ json: { markets: [market] } });
      return;
    }
    if (url.pathname.endsWith('/markets/1/sellers')) {
      await route.fulfill({ json: { sellers } });
      return;
    }
    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found', details: [] } } });
  });

  await page.goto('/seller-list');
  await expect(page.getByTestId('seller-list-loading')).toBeVisible();
  await expect(page.getByTestId('seller-list-search')).toBeVisible();
  await page.getByTestId('seller-list-search').fill('marker');
  await expect(page.getByTestId('seller-list-row-6')).toBeVisible();
  await expect(page.getByTestId('seller-list-row-7')).toBeHidden();
});
