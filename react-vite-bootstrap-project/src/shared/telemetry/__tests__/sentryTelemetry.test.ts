import { afterEach, describe, expect, it, vi } from 'vitest';

describe('sentryTelemetry', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('keeps telemetry disabled safely without DSN', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');
    const { initTelemetry } = await import('../sentryTelemetry');

    expect(() => initTelemetry()).not.toThrow();
  });
});
