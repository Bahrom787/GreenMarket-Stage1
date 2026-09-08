import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(__dirname, '../../..');

describe('noindex configuration', () => {
  it('blocks indexing through robots.txt, HTML meta and Vercel headers', () => {
    const robots = readFileSync(resolve(root, 'public/robots.txt'), 'utf8').trim().replace(/\r\n/g, '\n');
    const html = readFileSync(resolve(root, 'index.html'), 'utf8');
    const vercel = JSON.parse(readFileSync(resolve(root, 'vercel.json'), 'utf8')) as {
      headers?: Array<{ source: string; headers: Array<{ key: string; value: string }> }>;
    };

    expect(robots).toBe('User-agent: *\nDisallow: /');
    expect(html).toContain('<meta name="robots" content="noindex,nofollow,noarchive" />');
    expect(vercel.headers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: '/(.*)',
          headers: expect.arrayContaining([
            { key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' },
          ]),
        }),
        expect.objectContaining({
          source: '/robots.txt',
          headers: expect.arrayContaining([
            { key: 'Content-Type', value: 'text/plain; charset=utf-8' },
          ]),
        }),
      ]),
    );
    expect(existsSync(resolve(root, 'public/sitemap.xml'))).toBe(false);
  });
});
