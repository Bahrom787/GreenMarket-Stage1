import { expect, test, type Page } from '@playwright/test';
import { execFile } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const vercelConfig = JSON.parse(readFileSync(resolve(process.cwd(), 'vercel.json'), 'utf8')) as {
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};
const noindexHeader =
  vercelConfig.headers
    ?.find((rule) => rule.source === '/(.*)')
    ?.headers.find((header) => header.key.toLowerCase() === 'x-robots-tag')?.value ?? '';

function deployedBaseUrl() {
  const raw = process.env.E2E_VERCEL_BASE_URL ?? process.env.VERCEL_URL;
  if (!raw) return undefined;
  return (raw.startsWith('http') ? raw : `https://${raw}`).replace(/\/+$/, '');
}

async function getVercelHeaders(url: string) {
  const command = process.platform === 'win32' ? 'cmd.exe' : 'npx';
  const args =
    process.platform === 'win32'
      ? ['/d', '/s', '/c', 'npx.cmd', 'vercel', 'curl', url, '-I']
      : ['vercel', 'curl', url, '-I'];
  const { stdout } = await execFileAsync(command, args, {
    cwd: process.cwd(),
    timeout: 60_000,
    maxBuffer: 1024 * 1024,
  });
  return stdout
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

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

test('robots noindex files are exposed by the app shell', async ({ page, request }) => {
  const robots = await request.get('/robots.txt');
  expect(robots.status()).toBe(200);
  expect(robots.headers()['content-type']).toContain('text/plain');
  expect((await robots.text()).trim().replace(/\r\n/g, '\n')).toBe('User-agent: *\nDisallow: /');

  await page.goto('/');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'noindex,nofollow,noarchive');
});

test('X-Robots-Tag is returned by deployed Vercel SPA responses', async () => {
  const baseUrl = deployedBaseUrl();
  test.skip(!baseUrl, 'Set E2E_VERCEL_BASE_URL to verify deployed Vercel response headers');
  test.setTimeout(120_000);

  for (const route of ['/', '/map', '/seller-list', '/green-board', '/store/6', '/seller/6', '/product/169']) {
    const headers = await getVercelHeaders(`${baseUrl}${route}`);
    expect(headers[0]).toContain('200');
    expect(headers).toContain(`X-Robots-Tag: ${noindexHeader}`);
  }
});

test('Green Boardex page is a global static route with navigation and refresh', async ({ page }) => {
  const requests = await mockBuyerApi(page);

  await page.goto('/green-board');
  await expect(page).toHaveURL('/green-board');
  await expect(page.getByTestId('green-board-screen')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Green Boardex' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Каталог', exact: true })).toHaveAttribute('href', '/');
  await expect(page.getByRole('link', { name: 'Карта' })).toHaveAttribute('href', '/map');
  await expect(page.getByRole('link', { name: 'Продавцы' })).toHaveAttribute('href', '/seller-list');
  await expect(page.getByRole('link', { name: 'О Green Boardex' })).toHaveAttribute('href', '/green-board');
  expect(requests).toEqual([]);

  await page.reload();
  await expect(page).toHaveURL('/green-board');
  expect(requests).toEqual([]);

  await page.getByRole('link', { name: 'Перейти в каталог' }).click();
  await expect(page).toHaveURL('/');
  await page.goBack();
  await expect(page).toHaveURL('/green-board');
});

test('Green Boardex route does not load Store Context', async ({ page }) => {
  const requests = await mockBuyerApi(page);

  await page.goto('/green-board');
  await expect(page.getByTestId('green-board-screen')).toBeVisible();
  expect(requests.some((request) => request.includes('/sellers/6'))).toBe(false);

  await page.goto('/store/6');
  await expect(page.getByRole('heading', { name: 'Dev marker' })).toBeVisible();
});
