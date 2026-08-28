import { expect, test, type Page } from '@playwright/test';

const groups = [
  { id: 17, parent_id: null, name: 'Vegetables', sort_order: 10, product_count: 12 },
  { id: 18, parent_id: null, name: 'Greens and Salads', sort_order: 20, product_count: 8 },
  { id: 19, parent_id: null, name: 'Fruit', sort_order: 30, product_count: 4 },
];

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

async function mockCatalog(page: Page) {
  const requests: string[] = [];
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    requests.push(`${url.pathname}${url.search}`);

    if (url.pathname.endsWith('/groups')) {
      await route.fulfill({ json: { groups } });
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
          : globalProducts,
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
  await expect(page.getByRole('button', { name: 'Vegetables', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'Greens and Salads', exact: true })).toHaveAttribute('aria-pressed', 'true');

  await page.getByTestId('catalog-pagination').getByRole('button').last().click();
  await expect(page).toHaveURL(/group_id=17%2C18|group_id=17,18/);
  await expect(page).toHaveURL(/page=2/);

  await page.locator('.gm-catalog-filters > .gm-row').nth(1).getByRole('button').last().click();
  await expect(page).not.toHaveURL(/group_id=/);
  await expect(page).toHaveURL(/sort=name/);
  await expect(page).toHaveURL(/page=1/);
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
