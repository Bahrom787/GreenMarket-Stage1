import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sentryTelemetry', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('keeps telemetry disabled safely without DSN', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const { initTelemetry } = await import('../sentryTelemetry');

    expect(() => initTelemetry()).not.toThrow();
  });

  it('strips page URL query and request payload before sending to Sentry', async () => {
    const { sanitizeSentryEvent } = await import('../sentryTelemetry');
    const event = sanitizeSentryEvent({
      request: {
        url: 'https://green-market-stage1.vercel.app/seller-list?search=secret@example.com&phone=79991234567#x',
        query_string: 'search=secret@example.com',
        headers: { cookie: 'sid=1' },
        cookies: 'sid=1',
        data: 'Main Street',
      },
    });

    expect(JSON.stringify(event)).not.toContain('secret@example.com');
    expect(JSON.stringify(event)).not.toContain('79991234567');
    expect(JSON.stringify(event)).not.toContain('Main Street');
    expect(event.request?.url).toBe('https://green-market-stage1.vercel.app/seller-list');
  });
});
