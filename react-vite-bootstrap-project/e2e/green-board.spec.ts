import { expect, test, type Page } from '@playwright/test';
import { createServer, type Server } from 'node:http';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const appRoot = process.cwd();
const vercelConfig = JSON.parse(readFileSync(resolve(appRoot, 'vercel.json'), 'utf8')) as {
  headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
};
const noindexHeader =
  vercelConfig.headers
    ?.find((rule) => rule.source === '/(.*)')
    ?.headers.find((header) => header.key.toLowerCase() === 'x-robots-tag')?.value ?? '';

async function startVercelHeaderServer() {
  const indexHtml = readFileSync(resolve(appRoot, 'index.html'), 'utf8');
  const robotsTxt = readFileSync(resolve(appRoot, 'public/robots.txt'), 'utf8');
  const server = createServer((req, res) => {
    res.setHeader('X-Robots-Tag', noindexHeader);
    if (req.url === '/robots.txt') {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.end(robotsTxt);
      return;
    }
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(indexHtml);
  });
  await new Promise<void>((resolveReady) => server.listen(0, '127.0.0.1', resolveReady));
  const address = server.address();
  if (!address || typeof address === 'string') throw new Error('No test server port');
  return { server, origin: `http://127.0.0.1:${address.port}` };
}

function closeServer(server: Server) {
  return new Promise<void>((resolveClose, reject) => server.close((err) => (err ? reject(err) : resolveClose())));
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

test('X-Robots-Tag is returned for SPA route HTTP responses', async ({ request }) => {
  const { server, origin } = await startVercelHeaderServer();
  try {
    for (const route of ['/', '/map', '/seller-list', '/green-board', '/store/6', '/seller/6', '/product/169']) {
      const response = await request.get(`${origin}${route}`);
      expect(response.status()).toBe(200);
      expect(response.headers()['x-robots-tag']).toBe(noindexHeader);
    }
  } finally {
    await closeServer(server);
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
