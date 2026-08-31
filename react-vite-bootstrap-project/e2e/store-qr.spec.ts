import { expect, test, type Page } from '@playwright/test';

const sellers = {
  '6': {
    seller_id: 6,
    name: 'Dev marker',
    public_slug: 'dev-marker',
    public_url: 'https://dev-marker.example/',
    market: null,
    row: null,
    place: null,
    working_hours: null,
    short_description: null,
    phone: null,
    whatsapp: null,
  },
  '9': {
    seller_id: 9,
    name: 'Flower market',
    public_slug: 'flower-market',
    public_url: 'https://flower-market.example/',
    market: null,
    row: null,
    place: null,
    working_hours: null,
    short_description: null,
    phone: null,
    whatsapp: null,
  },
};

async function mockBuyerApi(page: Page) {
  await page.route('**/api/v1/catalog/**', async (route) => {
    const url = new URL(route.request().url());
    const sellerId = url.pathname.match(/\/sellers\/([^/]+)$/)?.[1];

    if (sellerId && sellerId in sellers) {
      await route.fulfill({ json: sellers[sellerId as keyof typeof sellers] });
      return;
    }

    await route.fulfill({ status: 404, json: { error: { code: 'NOT_FOUND', message: 'Not found', details: [] } } });
  });
}

test('Store Home prints QR from public store URL only', async ({ page }) => {
  await page.addInitScript(() => {
    window.print = () => {
      (window as unknown as { __storeQrPrinted: boolean }).__storeQrPrinted = true;
    };
  });
  await mockBuyerApi(page);

  await page.goto('/store/6');
  await expect(page.locator('h1', { hasText: 'Dev marker' })).toBeVisible();

  await page.getByRole('button', { name: 'Печать QR-кода' }).click();
  await expect(page.getByTestId('store-qr-print-material')).toBeVisible();
  await expect(page.getByLabel('QR-код магазина Dev marker')).toBeVisible();
  await expect(page.getByText('Откройте магазин камерой телефона')).toBeVisible();
  await expect(page.getByText(/vercel\.app|\/store\/6|seller_id/)).toHaveCount(0);

  await page.getByRole('button', { name: 'Печать', exact: true }).click();
  await expect.poll(() => page.evaluate(() => Boolean((window as unknown as { __storeQrPrinted?: boolean }).__storeQrPrinted))).toBe(true);
});

test('Store QR payload stays isolated per store', async ({ page }) => {
  await mockBuyerApi(page);

  await page.goto('/store/6');
  await page.getByRole('button', { name: 'Печать QR-кода' }).click();
  const qr6 = await page.getByTestId('store-qr-print-material').getAttribute('data-qr-payload');
  await expect(page.locator('h1', { hasText: 'Dev marker' })).toBeVisible();
  await page.getByRole('button', { name: 'Закрыть' }).click();

  await page.goto('/store/9');
  await page.getByRole('button', { name: 'Печать QR-кода' }).click();
  const qr9 = await page.getByTestId('store-qr-print-material').getAttribute('data-qr-payload');

  expect(qr6).toBe('https://dev-marker.example/');
  expect(qr9).toBe('https://flower-market.example/');
  expect(qr6).not.toBe(qr9);
  await expect(page.locator('h1', { hasText: 'Flower market' })).toBeVisible();
});

for (const width of [390, 1440]) {
  test(`Store QR preview fits ${width}px viewport`, async ({ page }) => {
    await page.setViewportSize({ width, height: width === 390 ? 844 : 900 });
    await mockBuyerApi(page);

    await page.goto('/store/6');
    await page.getByRole('button', { name: 'Печать QR-кода' }).click();
    await expect(page.getByTestId('store-qr-print-material')).toBeVisible();

    const hasOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    expect(hasOverflow).toBe(false);
  });
}
