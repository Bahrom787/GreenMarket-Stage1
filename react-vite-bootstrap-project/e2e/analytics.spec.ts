import { expect, test, type Page } from '@playwright/test';

async function mockCatalog(page: Page) {
  const metricaRequests: string[] = [];

  await page.route('**/mc.yandex.ru/**', async (route) => {
    metricaRequests.push(route.request().url());
    await route.abort();
  });

  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname.endsWith('/groups')) {
      await route.fulfill({ json: { groups: [] } });
      return;
    }
    if (url.pathname.endsWith('/products')) {
      await route.fulfill({
        json: {
          products: [{ id: 169, name: 'Milk', min_price: '125.00', offer_count: 1, photos: [] }],
          page: 1,
          limit: 12,
          total: 1,
        },
      });
      return;
    }
    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found', details: [] } } });
  });

  return metricaRequests;
}

test('analytics is disabled without Metrica env and does not block catalog UI', async ({ page }) => {
  const metricaRequests = await mockCatalog(page);

  await page.goto('/');
  await expect(page.getByText('Milk')).toBeVisible();

  expect(metricaRequests).toEqual([]);
});
