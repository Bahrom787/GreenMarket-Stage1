import { expect, test, type Page } from '@playwright/test';

async function mockBuyerApi(page: Page) {
  const requests: string[] = [];
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    requests.push(`${url.pathname}${url.search}`);

    if (url.pathname.endsWith('/groups')) {
      await route.fulfill({ json: { groups: [] } });
      return;
    }

    if (url.pathname.endsWith('/products')) {
      await route.fulfill({ json: { products: [], page: 1, limit: 24, total: 0 } });
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

    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found', details: [] } } });
  });
  return requests;
}

test('Green Board page is a global static route with navigation and refresh', async ({ page }) => {
  const requests = await mockBuyerApi(page);

  await page.goto('/green-board');
  await expect(page).toHaveURL('/green-board');
  await expect(page.getByTestId('green-board-screen')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Green Board' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Каталог', exact: true })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'Карта' })).toHaveAttribute('href', '/map');
  await expect(page.getByRole('link', { name: 'Продавцы' })).toHaveAttribute('href', '/seller-list');
  await expect(page.getByRole('link', { name: 'О Green Board' })).toHaveAttribute('href', '/green-board');
  expect(requests).toEqual([]);

  await page.reload();
  await expect(page).toHaveURL('/green-board');
  expect(requests).toEqual([]);

  await page.getByRole('link', { name: 'Перейти в каталог' }).click();
  await expect(page).toHaveURL('/');
  await page.goBack();
  await expect(page).toHaveURL('/green-board');
});

test('Green Board route does not load Store Context', async ({ page }) => {
  const requests = await mockBuyerApi(page);

  await page.goto('/green-board');
  await expect(page.getByTestId('green-board-screen')).toBeVisible();
  expect(requests.some((request) => request.includes('/sellers/6'))).toBe(false);

  await page.goto('/store/6');
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toBeVisible();
});
