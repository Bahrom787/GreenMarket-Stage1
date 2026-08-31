import { expect, test, type Page } from '@playwright/test';

const seller6 = {
  seller_id: 6,
  name: 'Dev marker',
  market: { id: 1, name: 'Dev market', type: 'SHOP', address: 'Kazan', latitude: null, longitude: null },
  row: null,
  place: null,
  working_hours: null,
  short_description: null,
  phone: null,
  whatsapp: null,
};

const seller9 = { ...seller6, seller_id: 9, name: 'Second marker' };

const product = {
  seller_product_id: 653,
  product_id: 169,
  name: 'Store Apple',
  catalog_name: 'Apple',
  group_id: 17,
  group_name: 'Fruit',
  price: '125.00',
  unit: 'pcs',
  stock: '9.000',
  description: null,
  origin_country: null,
  supply_date: null,
  photos: [],
};

async function mockStoreCatalog(page: Page, sellers: Record<string, unknown | Promise<unknown>>) {
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/groups')) {
      await route.fulfill({ json: { groups: [] } });
      return;
    }
    if (url.pathname.endsWith('/products')) {
      await route.fulfill({ json: { products: [product], page: 1, limit: 12, total: 1 } });
      return;
    }
    const match = url.pathname.match(/\/sellers\/(\d+)$/);
    if (match) {
      const seller = sellers[match[1]];
      if (seller) {
        await route.fulfill({ json: await seller });
      } else {
        await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found' } } });
      }
      return;
    }
    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found' } } });
  });
}

test('Store Catalog shows title skeleton until seller name loads', async ({ page }) => {
  let releaseSeller!: () => void;
  const delayedSeller = new Promise((resolve) => {
    releaseSeller = () => resolve(seller6);
  });
  await mockStoreCatalog(page, { 6: delayedSeller });

  await page.goto('/store/6/catalog');
  await expect(page.getByTestId('store-catalog-title-skeleton')).toBeVisible();
  await expect(page.getByText('Каталог магазина')).toHaveCount(0);

  releaseSeller();
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toBeVisible();
});

test('Store Catalog 404 renders not found without fallback title', async ({ page }) => {
  await mockStoreCatalog(page, {});

  await page.goto('/store/404/catalog');
  await expect(page.getByText('Магазин не найден')).toBeVisible();
  await expect(page.getByText('Каталог магазина')).toHaveCount(0);
  await expect(page.getByTestId('store-catalog-title-skeleton')).toHaveCount(0);
});

test('Store Catalog does not show previous seller title while next store loads', async ({ page }) => {
  let releaseSeller9!: () => void;
  const delayedSeller9 = new Promise((resolve) => {
    releaseSeller9 = () => resolve(seller9);
  });
  await mockStoreCatalog(page, { 6: seller6, 9: delayedSeller9 });

  await page.goto('/store/6/catalog');
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toBeVisible();

  await page.goto('/store/9/catalog');
  await expect(page.getByTestId('store-catalog-title-skeleton')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toHaveCount(0);

  releaseSeller9();
  await expect(page.getByRole('heading', { name: 'Second marker' })).toBeVisible();
});
