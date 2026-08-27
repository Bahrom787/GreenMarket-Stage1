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
